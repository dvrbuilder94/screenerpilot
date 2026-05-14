import { Helmet } from "react-helmet-async";

export interface SeoProps {
  title: string;
  description: string;
  path: string;
}

export const Seo = ({ title, description, path }: SeoProps) => {
  const url = `https://screenerpilot.com${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
