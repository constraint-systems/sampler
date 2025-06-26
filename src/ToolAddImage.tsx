import { useHandleUploadImage } from "./hooks";

export function ToolAddImage() {
  const { handleFileChange, imageUploadInputRef } = useHandleUploadImage();

  return (
    <label
      className={`py-1 w-1/2 text-center pointer-events-auto bg-neutral-800 hover:bg-neutral-700`}
      onClick={() => {}}
    >
      <input
        type="file"
        ref={imageUploadInputRef}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
      +image
    </label>
  );
}
