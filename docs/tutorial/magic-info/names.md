# Terminology

This document explains the key terms and concepts used in Magic.

## Core Concepts

### Node
A basic building block in Magic that represents a specific function or operation in your workflow. Nodes can be connected to create complex workflows.

### Flow
A sequence of connected nodes that define the logic and behavior of your application. Flows can be simple or complex, depending on your requirements.

### Workflow
A complete set of flows and configurations that make up your application. A workflow can contain multiple flows and can be deployed as a single unit.

## Node Types

### Basic Nodes
- **Start Node**: The entry point of a flow
- **Reply Node**: Sends responses back to users
- **Wait Node**: Pauses execution for a specified time
- **End Node**: Terminates a flow

### Logic Nodes
- **Condition Node**: Implements if-then-else logic
- **Loop Node**: Repeats a sequence of nodes
- **Switch Node**: Routes flow based on conditions

### Data Nodes
- **Database Node**: Interacts with databases
- **API Node**: Makes HTTP requests
- **File Node**: Handles file operations

## Configuration Terms

### Project
A container for all your workflows, configurations, and resources. Projects help organize and manage related applications.

### Environment
A specific configuration for running your application (e.g., development, staging, production).

### Resource
Any external service or component that your application depends on (e.g., databases, APIs, storage). 