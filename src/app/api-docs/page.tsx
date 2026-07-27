import { getApiDocs } from '@/lib/swagger';
import SwaggerUI from './SwaggerUI';

export default async function ApiDocsPage() {
  const spec = getApiDocs();
  return (
    <div className="min-h-screen">
      <SwaggerUI spec={spec} />
    </div>
  );
}