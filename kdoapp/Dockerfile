# Dockerfile for Next.js application
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Log the contents of the working directory before building
RUN echo "Contents of /app before build:" && ls -la /app

# Build the application
RUN npm run build \
  && echo "==== .next tree ====" \
  && find .next -maxdepth 3 | sed 's/^/   /'

# Log the contents of the .next directory after building
RUN echo "Contents of .next after build:" && ls -la .next

# Ensure the build directory is present
RUN test -d .next || (echo "Build directory not found! Run 'next build' to generate it." && exit 1)

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]