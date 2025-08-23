# MCP Servers Configuration for Seek Project

This document explains the Model Context Protocol (MCP) servers configured for the Seek tobacco price comparison project.

## Configured MCP Servers

### 1. 🗂️ Filesystem Server
**Purpose**: Enhanced file system operations for project management
**Package**: `@modelcontextprotocol/server-filesystem`
**Scope**: `/Users/claytonrector/Code/Seek`

**Capabilities**:
- Read, write, and modify project files
- Directory navigation and management
- File search and analysis
- Project structure operations

**Usage Examples**:
- "Show me all TypeScript files in the scrapers directory"
- "Create a new scraper file for [retailer name]"
- "Find all files containing 'tobacco' in the filename"

### 2. 🌐 Fetch Server
**Purpose**: Enhanced web content fetching for scraper development
**Package**: `@modelcontextprotocol/server-fetch`

**Capabilities**:
- Web page content retrieval
- HTML to markdown conversion
- HTTP request handling
- Website structure analysis

**Usage Examples**:
- "Fetch the current structure of smokingpipes.com product pages"
- "Check if TheCountrySquireOnline.com has changed their layout"
- "Analyze the HTML structure of a new retailer's website"

### 3. 🗄️ MongoDB Server
**Purpose**: Direct database operations and analysis
**Package**: `@modelcontextprotocol/server-mongodb`
**Connection**: `mongodb://admin:password@localhost:27017/seek?authSource=admin`

**Capabilities**:
- Database queries and aggregations
- Collection management
- Data analysis and reporting
- Schema inspection

**Usage Examples**:
- "Show me the total number of products by category"
- "Find products with price differences > $10 between retailers"
- "Generate a report of scraping statistics by retailer"
- "Query products added in the last 24 hours"

## How to Use

After restarting Claude Code, these servers will be available automatically. You can:

1. **Ask questions** about your project files
2. **Request data analysis** from your MongoDB database
3. **Fetch and analyze** retailer websites
4. **Perform complex operations** combining multiple servers

## Example Queries

### Database Analysis
```
"Using the MongoDB connection, show me:
1. Total products per retailer
2. Average price by tobacco category
3. Products with the biggest price differences"
```

### File Operations
```
"Look at all the scraper files and identify:
1. Common patterns
2. Which scrapers need updating
3. Missing error handling"
```

### Web Analysis
```
"Fetch the homepage of ammoseek.com and analyze:
1. Their navigation structure
2. Search functionality
3. Design patterns we could adopt"
```

## Troubleshooting

If MCP servers aren't working:

1. **Restart Claude Code** completely
2. **Check Docker containers** are running (`make dev-logs`)
3. **Verify MongoDB** is accessible at the configured URI
4. **Run `/doctor`** to check MCP server status

## Security Notes

- Filesystem server is scoped to your project directory only
- MongoDB connection uses the same credentials as your dev environment
- Fetch server operates with standard web request permissions

## Next Steps

With these MCP servers configured, you can now:
- Perform advanced database analytics on your tobacco price data
- Enhance your web scrapers with better site analysis
- Manage your project files more efficiently
- Combine multiple data sources for comprehensive analysis