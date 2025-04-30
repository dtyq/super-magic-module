class UnsupportedFileTypeError(Exception):
    def __init__(self, file_path: str, file_type: str):
        self.file_path = file_path
        self.file_type = file_type
        super().__init__(f"Unsupported file type: {file_type} for file: {file_path}")
