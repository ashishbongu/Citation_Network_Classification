import React from 'react';

// We can expand this list later. "all" means no filter.
const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'Genetics', label: 'Genetics' },
  { value: 'Immunology', label: 'Immunology' },
  { value: 'Public Health', label: 'Public Health' },
  { value: 'AI', label: 'AI / Machine Learning' },
  { value: 'Virology', label: 'Virology' },
];

function CategoryFilter({ selectedCategory, onCategoryChange }) {
  return (
    <div className="category-filter">
      <label htmlFor="category-select">Category:</label>
      <select 
        id="category-select"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        {categories.map(cat => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CategoryFilter;