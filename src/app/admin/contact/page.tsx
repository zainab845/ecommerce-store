import Contact from '@/lib/models/Contact';

async function getContacts() {
  const contacts = await Contact.find().sort({ createdAt: -1 });
  return contacts;
}

export default async function AdminContactPage() {
  const contacts = await getContacts();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-gray-500 mt-1">Customer inquiries and feedback</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {contacts.length === 0 ? (
          <p className="p-12 text-center text-gray-500">No messages yet</p>
        ) : (
          <div className="divide-y">
            {contacts.map((contact: any) => (
              <div key={contact._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full self-start">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-3 text-gray-700">{contact.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}