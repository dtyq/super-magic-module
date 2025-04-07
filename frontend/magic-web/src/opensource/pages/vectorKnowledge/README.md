# Vector Knowledge Base Module

This directory contains components, tools, and constant definitions related to the vector knowledge base. The module is mainly used for managing and utilizing vectorized document knowledge bases.

## Directory Structure

```
vectorKnowledge/
├── components/       # Components directory
│   ├── Create/       # Knowledge base creation components
│   ├── Details/      # Knowledge base details page components
│   ├── Embed/        # Document vector embedding components
│   ├── Setting/      # Knowledge base settings components
│   ├── SubSider/     # Side navigation components
│   └── Upload/       # Document upload components
├── constant/         # Constants definitions
│   └── index.tsx     # Contains file types, sync status, and other constants
├── layouts/          # Layout components
├── utils/            # Utility functions
```

## Main Features

### Knowledge Base Management
- Create knowledge base
- View knowledge base details
- Modify knowledge base settings

### Document Management
- Upload documents (supports multiple file formats)
- View document list
- Delete documents (supports batch operations)
- Search documents

### Document Processing
- Document vectorization processing
- Document status tracking (pending, processing, available, failed)

## Supported File Types
Supports various document formats, including:
- Text files (TXT, MARKDOWN)
- Document files (DOC, DOCX)
- Spreadsheet files (XLS, XLSX, CSV)
- PDF files
- Web files (HTML, HTM, XML)

## Technology Stack
- React
- TypeScript
- Ant Design component library
- RESTful API interaction 