'use client';

import SwaggerUILib from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

interface Props {
  // Changed from Record<string, unknown> to any to fix the TS mismatch
  spec: any; 
}

export default function SwaggerUI({ spec }: Props) {
  return (
    <SwaggerUILib
      spec={spec}
      docExpansion="list"
      defaultModelsExpandDepth={1}
      persistAuthorization={true}
    />
  );
}