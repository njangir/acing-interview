/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://afinterviceace.com',
    generateRobotsTxt: true,
    transform: async (config, url) => {
        let priority = 0.5;
    
        if (url === '/') {
          priority = 1.0;
        } else if (url.startsWith('/service')) {
          priority = 0.8;
        } else if (url.startsWith('/blog')) {
          priority = 0.6;
        } else {
          priority = 0.3;
        }    
        return {
          loc: url,
          changefreq: 'weekly',
          priority,
          lastmod: new Date().toISOString(),
        };
      },
    sitemapSize: 5000,
    exclude: ['/admin'], 
    robotsTxtOptions: {
      policies: [
        { userAgent: '*', allow: '/' },
        { userAgent: 'BadBot', disallow: '/' },
      ],
    },
  };