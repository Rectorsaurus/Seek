import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  brand: string;
  description?: string;
  category: 'aromatic' | 'english' | 'virginia' | 'burley' | 'latakia' | 'oriental' | 'perique' | 'cavendish' | 'bulk' | 'tinned';
  tobaccoType: string[];
  imageUrl?: string;
  retailers: IRetailerProduct[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRetailerProduct {
  retailerId: mongoose.Types.ObjectId;
  productUrl: string;
  currentPrice: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
  lastScraped: Date;
  priceHistory: IPriceHistory[];
}

export interface IPriceHistory {
  price: number;
  date: Date;
  availability: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  price: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  availability: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'limited', 'discontinued'],
    required: true
  }
});

const RetailerProductSchema = new Schema<IRetailerProduct>({
  retailerId: { type: Schema.Types.ObjectId, ref: 'Retailer', required: true },
  productUrl: { type: String, required: true },
  currentPrice: { type: Number, required: true },
  availability: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'limited', 'discontinued'],
    required: true
  },
  lastScraped: { type: Date, required: true, default: Date.now },
  priceHistory: [PriceHistorySchema]
});

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, index: true },
  brand: { type: String, required: true, index: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['aromatic', 'english', 'virginia', 'burley', 'latakia', 'oriental', 'perique', 'cavendish', 'bulk', 'tinned'],
    required: true,
    index: true
  },
  tobaccoType: [{ type: String, required: true }],
  imageUrl: { type: String },
  retailers: [RetailerProductSchema]
}, {
  timestamps: true
});

ProductSchema.index({ name: 'text', brand: 'text', description: 'text' });
ProductSchema.index({ 'retailers.currentPrice': 1 });
ProductSchema.index({ 'retailers.availability': 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);