import mongoose, { Schema, Document } from 'mongoose';

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

export const Retailer = mongoose.model<IRetailer>('Retailer', RetailerSchema);