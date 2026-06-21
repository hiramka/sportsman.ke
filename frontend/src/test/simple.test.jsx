import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Simple Test Suite', () => {
  it('should render a text element correctly', () => {
    render(<div>Hello Sportsman</div>);
    expect(screen.getByText('Hello Sportsman')).toBeInTheDocument();
  });
});
