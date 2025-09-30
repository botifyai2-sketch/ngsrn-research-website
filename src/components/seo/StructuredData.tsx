import React from 'react';

interface StructuredDataProps {
  data: Record<string, any>;
}

/**
 * Component to inject JSON-LD structured data into the page head
 */
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2)
      }}
    />
  );
}

/**
 * Hook to add structured data to the document head
 */
export function useStructuredData(data: Record<string, any>) {
  React.useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data, null, 2);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);
}