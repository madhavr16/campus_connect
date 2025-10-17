const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
    type: { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
});

const RiderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    seatsTaken: { type: Number, default: 1 },
    joinedAt: { type: Date, default: Date.now }
});

const TripSchema = new mongoose.Schema({
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    // optional GeoJSON points; originName/destinationName preferred when user supplies place names
    origin: { type: PointSchema, required: false },
    destination: { type: PointSchema, required: false },
    originName: { type: String },
    destinationName: { type: String },
    departureTime: Date,
    totalSeats: { type: Number, required: true, default: 4 },
    riders: [RiderSchema],
    totalCostEstimate: { type: Number, required: true, default: 0 },
    // chat messages for the trip room
    messages: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: String, createdAt: { type: Date, default: Date.now } }],
    createdAt: { type: Date, default: Date.now }
});

TripSchema.index({ origin: '2dsphere' });
TripSchema.index({ destination: '2dsphere' });

TripSchema.virtual('seatsAvailable').get(function () {
    const taken = this.riders.reduce((s, r) => s + (r.seatsTaken || 0), 0);
    return this.totalSeats - taken;
});

TripSchema.methods.costPerRider = function () {
    const totalPeople = 1 + (this.riders.length || 0); // driver included
    return totalPeople > 0 ? +(this.totalCostEstimate / totalPeople).toFixed(2) : this.totalCostEstimate;
}

module.exports = mongoose.model('Trip', TripSchema);
