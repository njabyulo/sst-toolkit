import { useCallback, useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "~/components/ui/button";

interface IStateFileUploadProps {
  onFileUpload: (file: File) => void;
}

export function StateFileUpload({ onFileUpload }: IStateFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileUpload(file);
      }
    },
    [onFileUpload]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button onClick={handleButtonClick} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        Upload State File
      </Button>
    </div>
  );
}

