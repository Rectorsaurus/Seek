import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  brand: string;
  description?: string;
  category: 'aromatic' | 'english' | 'virginia' | 'burley' | 'latakia' | 'oriental' | 'perique' | 'cavendish' | 'bulk' | 'tinned';
  tobaccoType: string[];
  imageUrl?: string;
  retailers: IRetailerProduct[];
  priority: 'standard' | 'popular' | 'limited_release' | 'seasonal' | 'discontinued';
  releaseType: 'regular' | 'limited' | 'seasonal' | 'anniversary' | 'exclusive' | 'small_batch';
  popularityScore: number;
  searchCount: number;
  lastStockChange?: Date;
  priceVolatility: number;
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

export interface IRetailer extends Document {
  name: string;
  baseUrl: string;
  logoUrl?: string;
  scrapingConfig: IScrapingConfig;
  isActive: boolean;
  lastScraped?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScrapingConfig {
  productListUrl: string;
  productListSelector: string;
  productLinkSelector: string;
  nameSelector: string;
  priceSelector: string;
  brandSelector?: string;
  descriptionSelector?: string;
  imageSelector?: string;
  availabilitySelector?: string;
  categorySelector?: string;
  waitForSelector?: string;
  delay: number;
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
  retailers: [RetailerProductSchema],
  priority: {
    type: String,
    enum: ['standard', 'popular', 'limited_release', 'seasonal', 'discontinued'],
    default: 'standard',
    index: true
  },
  releaseType: {
    type: String,
    enum: ['regular', 'limited', 'seasonal', 'anniversary', 'exclusive', 'small_batch'],
    default: 'regular',
    index: true
  },
  popularityScore: { type: Number, default: 0, index: true },
  searchCount: { type: Number, default: 0 },
  lastStockChange: { type: Date },
  priceVolatility: { type: Number, default: 0 }
}, {
  timestamps: true
});

const ScrapingConfigSchema = new Schema<IScrapingConfig>({
  productListUrl: { type: String, required: true },
  productListSelector: { type: String, required: true },
  productLinkSelector: { type: String, required: true },
  nameSelector: { type: String, required: true },
  priceSelector: { type: String, required: true },
  brandSelector: { type: String },
  descriptionSelector: { type: String },
  imageSelector: { type: String },
  availabilitySelector: { type: String },
  categorySelector: { type: String },
  waitForSelector: { type: String },
  delay: { type: Number, default: 1000 }
});

const RetailerSchema = new Schema<IRetailer>({
  name: { type: String, required: true, unique: true },
  baseUrl: { type: String, required: true },
  logoUrl: { type: String },
  scrapingConfig: { type: ScrapingConfigSchema, required: true },
  isActive: { type: Boolean, default: true },
  lastScraped: { type: Date }
}, {
  timestamps: true
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export const Retailer = mongoose.model<IRetailer>('Retailer', RetailerSchema);