export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/readme'],
      disallow: ['/admin', '/api/'],
    },
  };
}
