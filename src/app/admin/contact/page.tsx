import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// Define inline to match the API route's schema — prevents model conflict
const ContactSchema = new mongoose.Schema(
  { name: String, email: String, subject: String, message: String },
  { timestamps: true }
);
const ContactModel =
  mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

async function getContacts() {
  await dbConnect(); // THIS was missing — caused the page to fail silently
  const contacts = await ContactModel.find()
    .sort({ createdAt: -1 })
    .lean();
  return contacts;
}

export default async function AdminContactPage() {
  const contacts = await getContacts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {contacts.length} {contacts.length === 1 ? 'message' : 'messages'} received
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Messages submitted through the contact form will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(contacts as any[]).map((contact) => (
              <div key={String(contact._id)} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                    {contact.subject && (
                      <p className="text-xs text-indigo-600 font-medium mt-1">{contact.subject}</p>
                    )}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full self-start flex-shrink-0">
                    {new Date(contact.createdAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{contact.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}