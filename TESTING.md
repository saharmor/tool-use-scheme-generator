# Testing Checklist

## Manual Testing Guide

### Basic Functionality
- [ ] Page loads without errors
- [ ] "Add Function" button creates a new function card
- [ ] Function name input accepts text
- [ ] Function description textarea accepts text
- [ ] "Add Parameter" button creates a new parameter row

### Parameter Editing
- [ ] Parameter key input works
- [ ] Parameter type dropdown changes type
- [ ] Parameter description input works
- [ ] Required checkbox toggles state
- [ ] Delete parameter button removes parameter
- [ ] Advanced button opens modal

### Advanced Options
- [ ] Enum input (for string/number/integer types)
- [ ] Default value input
- [ ] Numeric constraints (min/max for number/integer)
- [ ] String constraints (pattern, minLength, maxLength)
- [ ] Array constraints (items type, minItems, maxItems)
- [ ] Object nested properties editor

### Function Management
- [ ] Duplicate function creates a copy
- [ ] Delete function removes the function
- [ ] Multiple functions can coexist

### Schema Output
- [ ] JSON preview updates in real-time
- [ ] Copy button copies to clipboard
- [ ] Download button saves as tools.json
- [ ] Test button validates schema

### Import/Export
- [ ] Import button opens modal
- [ ] Pasting valid JSON imports successfully
- [ ] Invalid JSON shows error message
- [ ] Import cancel button closes modal

### Sharing
- [ ] Share button generates URL
- [ ] Share URL can be copied
- [ ] Opening shared URL loads the configuration

### Persistence
- [ ] Refresh page preserves state (localStorage)
- [ ] Reset button clears all functions

### Validation
- [ ] Invalid function names show error
- [ ] Duplicate function names show error
- [ ] Duplicate parameter keys show error
- [ ] Validation status displays correctly

### Accessibility
- [ ] Tab navigation works
- [ ] Screen reader labels are present
- [ ] Buttons have aria-labels
- [ ] Modals have proper ARIA attributes

### Sample Files
- [ ] weather.json imports correctly
- [ ] array.json imports correctly
- [ ] nested-object.json imports correctly
- [ ] multi-tools.json imports correctly

## Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Testing
- [ ] Responsive layout on mobile
- [ ] Touch interactions work
- [ ] Modals display correctly

## Notes
- Test with large schemas (20+ functions, 50+ parameters)
- Test edge cases (empty strings, special characters)
- Verify no console errors during normal operation

