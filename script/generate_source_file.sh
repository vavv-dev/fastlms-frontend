#!/bin/bash

# Check if directory path is provided
if [ $# -eq 0 ]; then
    echo "Please provide a directory path"
    exit 1
fi

# Directory to search
dir_path="$1"

# Output file
output_file="source_file.txt"

# Find all files recursively and process them
find "$dir_path" -type f | while read -r file; do
    # Get relative path
    rel_path="${file#./}"

    # Write file start header
    echo "// file start: $rel_path" >> "$output_file"

    # Append file content
    cat "$file" >> "$output_file"

    # Write file end footer
    echo "// file end: $rel_path" >> "$output_file"

    # Add a newline for separation
    echo "" >> "$output_file"
done

echo "All files have been concatenated into $output_file"
