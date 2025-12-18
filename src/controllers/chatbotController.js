const Groq = require('groq-sdk');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// System prompt for the chatbot
const SYSTEM_PROMPT = `You are a helpful car rental assistant for GetSetRide. Your job is to help users find available cars and answer questions about the car rental service.

When users ask about cars, you should extract the following information if mentioned:
- City/Location (e.g., Chandigarh, Delhi, Mumbai)
- Car category (Sedan, SUV, Hatchback, Luxury, Sports, Electric)
- Transmission type (Automatic, Manual)
- Fuel type (Petrol, Diesel, Electric, Hybrid)
- Price range (min/max price per day)
- Number of seats needed

IMPORTANT: When the user asks about car availability or searching for cars, you MUST respond with a JSON object in this exact format:
{"action": "search_cars", "filters": {"city": "city_name", "category": "category", "transmission": "type", "fuelType": "type", "minPrice": number, "maxPrice": number, "seats": number}}

Only include filters that the user specifically mentioned. For example:
- "Show me cars in Chandigarh" → {"action": "search_cars", "filters": {"city": "Chandigarh"}}
- "Any SUVs in Delhi under 3000 per day" → {"action": "search_cars", "filters": {"city": "Delhi", "category": "SUV", "maxPrice": 3000}}

For general questions or greetings, respond naturally in plain text without JSON.

Available categories: Sedan, SUV, Hatchback, Luxury, Sports, Electric
Available transmissions: Automatic, Manual
Available fuel types: Petrol, Diesel, Electric, Hybrid`;

// @desc    Process chatbot message
// @route   POST /api/chatbot/message
// @access  Public
exports.processMessage = async (req, res, next) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a message'
            });
        }

        // Build messages array for Groq
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];

        // Get AI response
        const completion = await groq.chat.completions.create({
            messages: messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024,
        });

        const aiResponse = completion.choices[0]?.message?.content || '';

        // Try to parse as JSON for car search action
        let response = {
            success: true,
            type: 'text',
            message: aiResponse,
            cars: null
        };

        try {
            // Check if response contains JSON
            const jsonMatch = aiResponse.match(/\{[\s\S]*"action"[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                if (parsed.action === 'search_cars') {
                    // Build car query from filters
                    const filter = { isActive: true };
                    const filters = parsed.filters || {};

                    if (filters.city) {
                        filter['location.city'] = new RegExp(filters.city, 'i');
                    }
                    if (filters.category) {
                        filter.category = new RegExp(`^${filters.category}$`, 'i');
                    }
                    if (filters.transmission) {
                        filter.transmission = new RegExp(`^${filters.transmission}$`, 'i');
                    }
                    if (filters.fuelType) {
                        filter.fuelType = new RegExp(`^${filters.fuelType}$`, 'i');
                    }
                    if (filters.seats) {
                        filter.seats = { $gte: parseInt(filters.seats) };
                    }
                    if (filters.minPrice || filters.maxPrice) {
                        filter.pricePerDay = {};
                        if (filters.minPrice) filter.pricePerDay.$gte = parseInt(filters.minPrice);
                        if (filters.maxPrice) filter.pricePerDay.$lte = parseInt(filters.maxPrice);
                    }

                    // Query cars
                    const cars = await Car.find(filter)
                        .populate('host', 'fullName')
                        .limit(6)
                        .sort({ 'rating.average': -1 });

                    // Generate friendly response
                    let friendlyMessage;
                    if (cars.length === 0) {
                        friendlyMessage = `Sorry, I couldn't find any cars matching your criteria. Try adjusting your filters or searching in a different location.`;
                    } else {
                        friendlyMessage = `Great news! I found ${cars.length} car${cars.length > 1 ? 's' : ''} for you${filters.city ? ` in ${filters.city}` : ''}. Here's what's available:`;
                    }

                    response = {
                        success: true,
                        type: 'cars',
                        message: friendlyMessage,
                        filters: filters,
                        cars: cars
                    };
                }
            }
        } catch (parseError) {
            // Not JSON, keep as text response
            console.log('Response is plain text (no JSON action)');
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Chatbot error:', error);

        // Handle Groq API errors gracefully
        if (error.status === 401) {
            return res.status(500).json({
                success: false,
                message: 'AI service configuration error. Please contact support.'
            });
        }

        next(error);
    }
};

// @desc    Get quick suggestions for chatbot
// @route   GET /api/chatbot/suggestions
// @access  Public
exports.getSuggestions = async (req, res, next) => {
    try {
        // Get unique cities from cars
        const cities = await Car.distinct('location.city', { isActive: true });

        // Get car count by category
        const categoryStats = await Car.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const suggestions = [
            'Show me available cars',
            cities[0] ? `Cars in ${cities[0]}` : null,
            categoryStats[0] ? `Show me ${categoryStats[0]._id}s` : null,
            'Cars under ₹2000 per day',
            'Automatic transmission cars',
            'Electric vehicles available'
        ].filter(Boolean);

        res.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        next(error);
    }
};
