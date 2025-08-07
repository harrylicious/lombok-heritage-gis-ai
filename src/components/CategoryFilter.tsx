import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  color_hex: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  siteCount?: number;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  siteCount = 0
}) => {
  return (
    <Card className="p-4 bg-gradient-to-br from-background to-secondary/30">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-heritage" />
        <h3 className="font-semibold text-foreground">Filter Kategori</h3>
        {siteCount > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {siteCount} situs
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {/* All Categories Button */}
        <Button
          variant={selectedCategory === null ? "default" : "ghost"}
          size="sm"
          onClick={() => onCategorySelect(null)}
          className={`w-full justify-start ${
            selectedCategory === null 
              ? 'bg-primary text-primary-foreground shadow-cultural' 
              : 'hover:bg-secondary'
          }`}
        >
          <span className="mr-2">🏛️</span>
          Semua Kategori
        </Button>

        {/* Individual Category Buttons */}
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onCategorySelect(category.id)}
            className={`w-full justify-start transition-all ${
              selectedCategory === category.id
                ? 'shadow-cultural'
                : 'hover:bg-secondary'
            }`}
            style={
              selectedCategory === category.id
                ? {
                    backgroundColor: category.color_hex,
                    color: '#ffffff',
                  }
                : {}
            }
          >
            <div 
              className="w-3 h-3 rounded-full mr-3 border border-white/30"
              style={{ backgroundColor: category.color_hex }}
            />
            <span className="flex-1 text-left capitalize">
              {category.name.replace('_', ' ')}
            </span>
            {selectedCategory === category.id && (
              <X 
                className="w-4 h-4 ml-2" 
                onClick={(e) => {
                  e.stopPropagation();
                  onCategorySelect(null);
                }}
              />
            )}
          </Button>
        ))}
      </div>

      {/* Category Description */}
      {selectedCategory && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            {categories.find(c => c.id === selectedCategory)?.description}
          </p>
        </div>
      )}
    </Card>
  );
};

export default CategoryFilter;