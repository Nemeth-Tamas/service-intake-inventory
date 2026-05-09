import { createWorkOrder } from '@/lib/actions';

export default function NewWorkOrder() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Új Beszállítás</h1>
      <form action={createWorkOrder} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ügyfél Neve</label>
          <input
            name="customerName"
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Példa János"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Elérhetőség (Telefon/Email)</label>
          <input
            name="customerContact"
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="+36 30 123 4567"
          />
        </div>
        <hr className="my-4" />
        <div>
          <label className="block text-sm font-medium mb-1">Eszköz Típusa</label>
          <input
            name="deviceType"
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="Laptop, PC, Monitor..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sorozatszám / ID</label>
          <input
            name="serialNumber"
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="S/N: 12345678"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Eszköz Állapota</label>
          <textarea
            name="condition"
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Karcok a fedélen, kijelző ép..."
          ></textarea>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hiba Leírása</label>
          <textarea
            name="complaint"
            className="w-full p-2 border rounded-md"
            rows={3}
            placeholder="Nem kapcsol be, hangos hűtés..."
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 transition"
        >
          Munkalap Létrehozása
        </button>
      </form>
    </div>
  );
}
