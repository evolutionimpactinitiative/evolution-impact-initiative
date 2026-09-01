import { VillagePostForm } from "../VillagePostForm";

export default function NewVillagePostPage() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="font-heading font-black text-2xl text-brand-dark">
          New Our Village post
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Save as draft first, preview, then publish when it's ready.
        </p>
      </div>
      <VillagePostForm />
    </div>
  );
}
