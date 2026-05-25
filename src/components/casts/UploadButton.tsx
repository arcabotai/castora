import { useState, useRef, useEffect } from 'react'
import { PhotoIcon } from '@heroicons/react/24/outline'

import { uploadFileClientSide } from '@/utils/upload'
import { toast } from 'sonner';
import { DRAFT_SEND_STATUS, Draft } from '@prisma/client';
import { Button } from '../ui/button';
import { usePrivy } from '@privy-io/react-auth';
import { useSupercastUserState } from '@/providers/SupercastUserStateProvider';

interface Props {
  currentDraft?: Draft;
  uploadedCid: string;
  setCid: React.Dispatch<React.SetStateAction<string>>;
  filename: string;
  setFilename: React.Dispatch<React.SetStateAction<string>>;
  castEmbeds: any[];
  setCastEmbeds: React.Dispatch<React.SetStateAction<any[]>>
  textAreaElement: HTMLTextAreaElement;
}

export default function UploadButton(props: Props) {

  const { currentDraft, uploadedCid, setCid, filename, setFilename, castEmbeds, setCastEmbeds, textAreaElement } = props

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState("");
  const { getAccessToken } = usePrivy();
  const { supercastUserState } = useSupercastUserState();

  const inputFile = useRef(null);

  const validateFileType = (file: File) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',  // Common format for iOS photos
      'image/heif',  // High Efficiency Image Format
      'image/bmp',   // Bitmap
      'image/svg+xml', // SVG
      'image/tiff',  // TIFF
      'image/x-icon' // ICO
    ];

    // Some devices/browsers might report slightly different MIME types
    const fileType = file.type.toLowerCase();
    const isAllowedType = allowedTypes.some(type => fileType.includes(type.toLowerCase()));

    if (!isAllowedType) {
      toast.error('Unsupported file type. Please upload an image file.');
      return false;
    }

    // Add size check (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('File too large. Please upload an image under 10MB.');
      return false;
    }

    return true;
  };

  const getUploadOptions = async () => {
    const accessToken = await getAccessToken();
    const asFid = supercastUserState?.currentFid;

    if (!accessToken || !asFid) {
      throw new Error('Please sign in before uploading.');
    }

    return { accessToken, asFid };
  };

  const uploadSelectedFile = async (file: File) => {
    const uploadOptions = await getUploadOptions();
    return uploadFileClientSide(file, uploadOptions);
  };

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!validateFileType(file)) return;

    setFile(file);
    setUploading(true);
    uploadSelectedFile(file)
      .then((res) => {
        setCid(res.IpfsHash);
        setFilename(res.uploadedFilename);
        toast.success('File uploaded successfully');
      })
      .catch((e) => {
        toast.error(e.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const handlePaste = async (e) => {
    if (document.activeElement !== textAreaElement) return

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (!validateFileType(file)) return;

        setUploading(true);
        uploadSelectedFile(file)
          .then((res) => {
            setCid(res.IpfsHash);
            setFilename(res.uploadedFilename);
            toast.success('File uploaded successfully');
          })
          .catch((e) => {
            toast.error(e.message);
          })
          .finally(() => {
            setUploading(false);
          });
        break; // Assuming only one file is pasted
      }
    }
  };

  useEffect(() => {
    if (uploadedCid.length > 0 && filename.length > 0) {
      if (castEmbeds.length == 2) return

      setCastEmbeds([...castEmbeds, { "url": `https://supercast.mypinata.cloud/ipfs/${uploadedCid}?filename=${filename}` }])

      setCid("");
      setFilename("");
    }

  }, [uploadedCid, filename])

  useEffect(() => {
    // Add paste event listener on mount
    window.addEventListener('paste', handlePaste);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault(); // Prevent default behavior to enable drop functionality.
      textAreaElement.style.backgroundColor = '#f3f4f6'; // chat gpt color lol
      textAreaElement.style.transition = 'background-color 0.3s ease';
      // support dark mode
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        textAreaElement.style.backgroundColor = '#222'; // chat gpt color lol
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault(); // Prevent default behavior to enable drop functionality.
      textAreaElement.style.backgroundColor = 'transparent';
    };

    const handleDrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.items) {
        for (var i = 0; i < e.dataTransfer.items.length; i++) {
          if (e.dataTransfer.items[i].kind === 'file') {
            var file = e.dataTransfer.items[i].getAsFile();
            if (!validateFileType(file)) {
              textAreaElement.style.backgroundColor = 'transparent';
              return;
            }

            setUploading(true);
            uploadSelectedFile(file)
              .then((res) => {
                setCid(res.IpfsHash);
                setFilename(res.uploadedFilename);
                toast.success('File uploaded successfully');
              })
              .catch((error) => {
                toast.error(error.message);
              })
              .finally(() => {
                setUploading(false);

              });
          }
        }
      }
      textAreaElement.style.backgroundColor = 'transparent';
    };

    if (textAreaElement) {
      textAreaElement.addEventListener('dragover', handleDragOver);
      textAreaElement.addEventListener('drop', handleDrop);
      textAreaElement.addEventListener('dragleave', handleDragLeave);

      // Cleanup on unmount
      return () => {
        textAreaElement.removeEventListener('dragover', handleDragOver);
        textAreaElement.removeEventListener('drop', handleDrop);
      };
    }
  }, [textAreaElement]); // Add other dependencies as necessary


  return (

    <div className="flex items-center gap-x-2">
      <input
        type="file"
        id="file"
        ref={inputFile}
        onChange={handleChange}
        className='hidden'
        accept="image/*,.heic,.heif"  // Updated to accept all image types plus HEIC/HEIF explicitly
      />
      <Button
        onClick={() => inputFile.current.click()}
        disabled={uploading || castEmbeds.length == 2 || (!!currentDraft && (currentDraft.sendStatus === DRAFT_SEND_STATUS.SENT || currentDraft.sendStatus === DRAFT_SEND_STATUS.SCHEDULED))}
        className="flex flex-row items-center justify-center"
        variant='outline'
        size='sm'
      >
        {uploading ?
          <div role="status" className='flex flex-row justify-center mx-auto'>
            <svg aria-hidden="true" className="w-5 h-5 mx-auto text-gray-200 animate-spin fill-gray-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
          :
          <PhotoIcon className='w-5 h-5 text-gray-500' />
        }
      </Button>
    </div>
  )
}
