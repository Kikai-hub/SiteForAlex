import { CourierForm } from "@/components/admin/CourierForm";

export default function NewCourierPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-char">Новый курьер</h1>
      <div className="mt-6">
        <CourierForm />
      </div>
    </div>
  );
}
