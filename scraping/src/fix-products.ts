#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { Product } from './models';
import { DatabaseManager } from './utils/database';

// Define the fixes to apply
const brandFixes: { [key: string]: string } = {
  '123 mixture': 'Robert Lewis',
  '123': 'Robert Lewis',
  'royal comfort': 'Royal Comfort'
};

async function fixProducts() {
  try {
    console.log('Connecting to database...');
    const dbManager = DatabaseManager.getInstance();
    await dbManager.connect();
    console.log('Connected to database');

    // Fix brand issues
    console.log('\n=== Fixing Brand Issues ===');
    
    for (const [namePattern, correctBrand] of Object.entries(brandFixes)) {
      const regex = new RegExp(namePattern, 'i');
      const products = await Product.find({
        $or: [
          { name: regex },
          { brand: 'Unknown' }
        ]
      });

      console.log(`Found ${products.length} products matching "${namePattern}"`);
      
      for (const product of products) {
        if (product.name.toLowerCase().includes(namePattern)) {
          const oldBrand = product.brand;
          product.brand = correctBrand;
          await product.save();
          console.log(`Updated ${product.name}: ${oldBrand} → ${correctBrand}`);
        }
      }
    }

    // Fix stock number issues
    console.log('\n=== Fixing Stock Numbers in Names ===');
    
    const productsWithStockNumbers = await Product.find({
      name: /\d{3}-\d{3}-\d{4}/
    });

    console.log(`Found ${productsWithStockNumbers.length} products with stock numbers in names`);

    for (const product of productsWithStockNumbers) {
      const originalName = product.name;
      
      // Apply the same cleaning logic as the scraper
      let cleanName = originalName;
      
      // Remove product codes (patterns like 003-057-0003, 005-443-0245, etc.)
      cleanName = cleanName.replace(/\s+\d{3}-\d{3}-\d{4}/g, '');
      cleanName = cleanName.replace(/\s+\d{3}-\d{2,3}-\d{4}/g, '');
      
      // Remove weight indicators
      cleanName = cleanName.replace(/\s+\d+g\b/gi, '');
      cleanName = cleanName.replace(/\s+\d+oz\b/gi, '');
      
      // Clean up multiple spaces
      cleanName = cleanName.replace(/\s+/g, ' ').trim();
      
      if (cleanName !== originalName && cleanName.length > 5) {
        product.name = cleanName;
        await product.save();
        console.log(`Cleaned name: "${originalName}" → "${cleanName}"`);
      }
    }

    // Fix concatenated name issues
    console.log('\n=== Fixing Concatenated Names ===');
    
    const concatenatedProducts = await Product.find({
      name: { $regex: /.{150,}/ }
    });

    console.log(`Found ${concatenatedProducts.length} products with concatenated names`);

    for (const product of concatenatedProducts) {
      const originalName = product.name;
      
      // Try to extract the first product name from the concatenation
      const firstProductMatch = originalName.match(/^([^0-9]*?(?:mixture|blend|flake|virginia|burley|aromatic|english|comfort)[^0-9]*?)(?:\s+\d{3}[-\d]|\s+\d+g|\s+\d+oz|\s+[A-Z][a-z]+\s+[A-Z])/i);
      let cleanName: string;
      
      if (firstProductMatch) {
        cleanName = firstProductMatch[1].trim();
        console.log(`Extracted from concatenation: "${cleanName}"`);
      } else {
        // Fallback: take first 50 characters and find last complete word
        cleanName = originalName.substring(0, 50);
        const lastSpaceIndex = cleanName.lastIndexOf(' ');
        if (lastSpaceIndex > 10) {
          cleanName = cleanName.substring(0, lastSpaceIndex);
        }
        console.log(`Fallback extraction: "${cleanName}"`);
      }
      
      // Additional cleaning
      cleanName = cleanName.replace(/\s+\d{3}-\d{3}-\d{4}/g, '');
      cleanName = cleanName.replace(/\s+\d+g\b/gi, '');
      cleanName = cleanName.replace(/\s+\d+oz\b/gi, '');
      cleanName = cleanName.replace(/\s+/g, ' ').trim();
      
      if (cleanName.length > 5 && cleanName !== originalName) {
        product.name = cleanName;
        
        // Also try to fix the brand for this cleaned name
        const lowerName = cleanName.toLowerCase();
        for (const [pattern, brand] of Object.entries(brandFixes)) {
          if (lowerName.includes(pattern)) {
            product.brand = brand;
            break;
          }
        }
        
        await product.save();
        console.log(`Fixed concatenated name: "${originalName.substring(0, 100)}..." → "${cleanName}"`);
        if (product.brand !== 'Unknown') {
          console.log(`  Also fixed brand to: ${product.brand}`);
        }
      }
    }

    console.log('\n=== Fix completed ===');
    
  } catch (error) {
    console.error('Error fixing products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the fix
fixProducts();