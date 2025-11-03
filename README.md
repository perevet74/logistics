# JP Logistics Website

A modern, responsive logistics company website cloned from http://jpeglogistics.cc/ with all design, fonts, and structure maintained. This website features shipping-related images to avoid copyright issues.

## Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Color Gradient Theme**: Beautiful teal gradient color scheme throughout
- **Shipping Images**: Real shipping-related photos from Unsplash
- **Multiple Pages**: Home, Services, About, Contact
- **Interactive Elements**: Smooth scrolling, mobile menu, form handling

## Pages

1. **index.html** - Homepage with hero section, stats, services, testimonials
2. **services.html** - Detailed services information
3. **about.html** - Company information and values
4. **contact.html** - Contact form and map

## Files Structure

```
/
├── index.html          # Homepage
├── services.html       # Services page
├── about.html          # About page
├── contact.html        # Contact page
├── styles.css          # All CSS styling
├── script.js           # JavaScript functionality
└── README.md           # Documentation
```

## Design Features

- **Typography**: Inter font family (Google Fonts)
- **Colors**: Teal gradient theme (--teal-gradient)
- **Layout**: Modern, clean grid-based layout
- **Images**: All images are from Unsplash API, shipping-related
- **Icons**: Simple, text-based navigation

## Technologies Used

- HTML5
- CSS3 (with custom properties and animations)
- JavaScript (vanilla)
- Google Fonts (Inter)

## Getting Started

Simply open `index.html` in your web browser to view the website. No build process or dependencies required.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

The website uses CSS custom properties for easy customization. Main color variables can be found in the `:root` section of `styles.css`:

```css
:root {
    --teal-gradient: linear-gradient(135deg, #00c4cc 0%, #0078a6 100%);
    --primary-color: #667eea;
    --text-dark: #1a1a2e;
    --text-light: #6c757d;
}
```

## Notes

- All images are loaded from Unsplash API
- Contact form submission is currently handled by JavaScript (no backend)
- Map integration uses Google Maps embed
- No actual logo is used (replaced with text logo to avoid copyright issues)


