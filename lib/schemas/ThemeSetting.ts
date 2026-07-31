import mongoose from 'mongoose';

const ThemeSettingSchema = new mongoose.Schema({
  announcementText: { type: String, default: '✨ Special Offer: Free shipping on orders above ₹500 across India!' },
  announcementEmail: { type: String, default: 'authorsbook01@gmail.com' },
  announcementPhone: { type: String, default: '+91 9265795380' },
  aboutHeading: { type: String, default: 'About Us' },
  aboutQuote: { type: String, default: 'If you don’t like to read, you haven’t found the right book yet' },
  aboutText: { type: String, default: 'Hey beautiful human 👋 Welcome to Authors Book. Books made us a little too aware of how important it is to buy, read and have one.' },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.ThemeSetting || mongoose.model('ThemeSetting', ThemeSettingSchema);
