// Script to add sample cars to the database
const mongoose = require('mongoose');
const Car = require('../src/models/Car');
const User = require('../src/models/User');
const config = require('../src/config');

const sampleCars = [
  {
    brand: 'Toyota',
    model: 'Camry',
    year: 2023,
    category: 'Sedan',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    pricePerDay: 2500,
    location: {
      city: 'Mumbai',
      address: 'Bandra West, Mumbai',
      state: 'Maharashtra'
    },
    images: ['https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg'],
    features: ['AC', 'GPS', 'Bluetooth', 'Parking Sensors'],
    description: 'Well-maintained Toyota Camry with excellent fuel efficiency',
    licensePlate: 'MH01AB1234',
    isActive: true
  },
  {
    brand: 'Honda',
    model: 'City',
    year: 2022,
    category: 'Sedan',
    transmission: 'Manual',
    fuelType: 'Diesel',
    seats: 5,
    pricePerDay: 2000,
    location: {
      city: 'Mumbai',
      address: 'Andheri East, Mumbai',
      state: 'Maharashtra'
    },
    images: ['https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg'],
    features: ['AC', 'Music System', 'Power Windows'],
    description: 'Fuel-efficient Honda City perfect for city drives',
    licensePlate: 'MH02CD5678',
    isActive: true
  },
  {
    brand: 'Mahindra',
    model: 'Thar',
    year: 2023,
    category: 'SUV',
    transmission: 'Manual',
    fuelType: 'Diesel',
    seats: 4,
    pricePerDay: 3500,
    location: {
      city: 'Pune',
      address: 'Koregaon Park, Pune',
      state: 'Maharashtra'
    },
    images: ['https://images.pexels.com/photos/13861/IMG_3496bfree.jpg'],
    features: ['4x4', 'AC', 'Convertible Top', 'Off-road Capable'],
    description: 'Adventure-ready Mahindra Thar for weekend getaways',
    licensePlate: 'MH12EF9012',
    isActive: true
  },
  {
    brand: 'Maruti',
    model: 'Swift',
    year: 2022,
    category: 'Hatchback',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    pricePerDay: 1500,
    location: {
      city: 'Delhi',
      address: 'Connaught Place, New Delhi',
      state: 'Delhi'
    },
    images: ['https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg'],
    features: ['AC', 'Airbags', 'ABS', 'Power Steering'],
    description: 'Compact and economical Maruti Swift',
    licensePlate: 'DL01GH3456',
    isActive: true
  },
  {
    brand: 'Hyundai',
    model: 'Creta',
    year: 2023,
    category: 'SUV',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    pricePerDay: 3000,
    location: {
      city: 'Bangalore',
      address: 'Indiranagar, Bangalore',
      state: 'Karnataka'
    },
    images: ['https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg'],
    features: ['Sunroof', 'Leather Seats', 'Wireless Charging', 'Touchscreen'],
    description: 'Premium Hyundai Creta with all modern features',
    licensePlate: 'KA03IJ7890',
    isActive: true
  },
  {
    brand: 'Tesla',
    model: 'Model 3',
    year: 2023,
    category: 'Electric',
    transmission: 'Automatic',
    fuelType: 'Electric',
    seats: 5,
    pricePerDay: 5000,
    location: {
      city: 'Mumbai',
      address: 'Worli, Mumbai',
      state: 'Maharashtra'
    },
    images: ['https://images.pexels.com/photos/2127039/pexels-photo-2127039.jpeg'],
    features: ['Autopilot', 'Supercharger Access', 'Premium Audio', 'Glass Roof'],
    description: 'Experience the future with Tesla Model 3',
    licensePlate: 'MH03KL1122',
    isActive: true
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('📡 Connected to MongoDB');

    // Find a host user (if one exists, otherwise use the first user)
    let host = await User.findOne({ role: 'host' });
    
    if (!host) {
      host = await User.findOne();
      if (!host) {
        console.error('❌ No users found in database. Please create a user first.');
        process.exit(1);
      }
      // Make this user a host
      host.role = 'host';
      await host.save();
      console.log(`👤 Made user ${host.email} a host`);
    }

    console.log(`👤 Using host: ${host.email}`);

    // Clear existing cars (optional)
    const existingCount = await Car.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Found ${existingCount} existing cars`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      // Note: This won't work in automated scripts, so we'll just add cars
      console.log('📝 Adding new cars without deleting existing ones...');
    }

    // Add host ID to all sample cars
    const carsWithHost = sampleCars.map(car => ({
      ...car,
      host: host._id
    }));

    // Insert sample cars
    const insertedCars = await Car.insertMany(carsWithHost);
    console.log(`✅ Successfully added ${insertedCars.length} sample cars!`);

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`   - Total cars in database: ${await Car.countDocuments()}`);
    console.log(`   - Host: ${host.fullName} (${host.email})`);
    
    console.log('\n🎉 Database seeding complete!');
    console.log('\n🔗 You can now test the API:');
    console.log('   GET http://localhost:5000/api/cars');
    console.log('   GET http://localhost:5000/api/cars?city=Mumbai');
    console.log('   GET http://localhost:5000/api/cars?category=SUV\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
