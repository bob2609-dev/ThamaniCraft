export const withSorters = (columns) => {
  return columns.map(col => {
    // Don't add sorter for Actions or if one already exists
    if (!col.sorter && col.title !== 'Actions') {
      return {
        ...col,
        sorter: (a, b) => {
          let valA = a;
          let valB = b;
          
          if (col.dataIndex) {
            if (Array.isArray(col.dataIndex)) {
              for (const key of col.dataIndex) {
                valA = valA?.[key];
                valB = valB?.[key];
              }
            } else {
              valA = valA?.[col.dataIndex];
              valB = valB?.[col.dataIndex];
            }
          } else if (col.key) {
            valA = a?.[col.key];
            valB = b?.[col.key];
          }

          // Best effort for render-only columns returning primitives
          if ((valA === a || valA === undefined) && col.render) {
             try {
                const rA = col.render(undefined, a, 0);
                const rB = col.render(undefined, b, 0);
                if (typeof rA === 'string' || typeof rA === 'number') valA = rA;
                if (typeof rB === 'string' || typeof rB === 'number') valB = rB;
             } catch(e) {
                 // ignore render errors during sort evaluation
             }
          }

          if (valA === valB) return 0;
          if (valA === null || valA === undefined || valA === '') return -1;
          if (valB === null || valB === undefined || valB === '') return 1;
          
          if (typeof valA === 'number' && typeof valB === 'number') {
            return valA - valB;
          }
          
          return String(valA).localeCompare(String(valB), undefined, { numeric: true });
        }
      };
    }
    return col;
  });
};
