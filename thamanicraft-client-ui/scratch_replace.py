import os
import glob
import re

pages_dir = 'src/pages'
components_dir = 'src/components'

files = glob.glob(os.path.join(pages_dir, '*.jsx'))

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    if '<Table' in content:
        # Check if SearchableTable is already imported
        if 'SearchableTable' not in content:
            # Find the line with import React or any other import and insert it
            lines = content.split('\n')
            import_index = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    import_index = i
            
            lines.insert(import_index + 1, "import SearchableTable from '../components/SearchableTable';")
            content = '\n'.join(lines)
        
        # Replace <Table with <SearchableTable
        content = content.replace('<Table ', '<SearchableTable ')
        content = content.replace('<Table\n', '<SearchableTable\n')
        
        # We don't need to touch withSorters because SearchableTable already calls withSorters inside it.
        # It's idempotent, so calling it twice on the columns array is fine.
        
        with open(file, 'w') as f:
            f.write(content)
            
print("Done modifying tables.")
