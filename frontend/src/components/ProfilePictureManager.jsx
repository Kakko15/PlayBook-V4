import { useState, useRef, useCallback } from 'react';
import AvatarEditor from 'react-avatar-editor';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import WebcamCapture from '@/components/WebcamCapture';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Icon from './Icon';

const ProfilePictureManager = ({
  isOpen,
  onClose,
  onSuccess,
  currentImageUrl,
}) => {
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [mode, setMode] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
      }
      setImage(URL.createObjectURL(file));
      setMode('edit');
    }
  };

  const handleWebcamCapture = (imageSrc) => {
    setImage(imageSrc);
    setMode('edit');
  };

  const handleSave = async () => {
    if (editorRef.current) {
      setIsLoading(true);
      const canvas = editorRef.current.getImageScaledToCanvas();
      const imageBase64 = canvas.toDataURL('image/jpeg');

      try {
        const faceResult = await api.detectFace(imageBase64);
        if (!faceResult.faceFound) {
          toast.error(faceResult.message);
          setIsLoading(false);
          return;
        }

        const { profilePictureUrl } =
          await api.updateProfilePicture(imageBase64);
        toast.success(faceResult.message);
        onSuccess(profilePictureUrl);
        handleClose();
      } catch (error) {
        toast.error(
          error.response?.data?.message || 'Failed to update profile picture.'
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await api.removeProfilePicture();
      toast.success('Profile picture removed.');
      onSuccess(null);
      handleClose();
    } catch (error) {
      toast.error('Failed to remove profile picture.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setImage(null);
    setScale(1.2);
    setMode('main');
    onClose();
  };

  const renderContent = () => {
    switch (mode) {
      case 'edit':
        return (
          <>
            <div className='flex justify-center'>
              <AvatarEditor
                ref={editorRef}
                image={image}
                width={250}
                height={250}
                border={50}
                borderRadius={125}
                color={[255, 255, 255, 0.6]}
                scale={scale}
                rotate={0}
              />
            </div>
            <div className='mt-4 space-y-2'>
              <Label htmlFor='scale'>Zoom</Label>
              <Slider
                id='scale'
                min={1}
                max={2}
                step={0.01}
                value={[scale]}
                onValueChange={(val) => setScale(val[0])}
              />
            </div>
            <DialogFooter className='mt-4'>
              <Button
                variant='ghost'
                onClick={() => setMode('main')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                Save
              </Button>
            </DialogFooter>
          </>
        );
      case 'webcam':
        return (
          <WebcamCapture
            onCapture={handleWebcamCapture}
            onCancel={() => setMode('main')}
          />
        );
      case 'main':
      default:
        return (
          <>
            <input
              type='file'
              ref={fileInputRef}
              onChange={handleFileChange}
              accept='image/png, image/jpeg'
              className='hidden'
            />
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <Button
                variant='outline'
                onClick={() => fileInputRef.current.click()}
                className='h-20'
              >
                <Icon name='upload_file' className='mr-2' />
                Upload Image
              </Button>
              <Button
                variant='outline'
                onClick={() => setMode('webcam')}
                className='h-20'
              >
                <Icon name='photo_camera' className='mr-2' />
                Take Photo
              </Button>
            </div>
            {currentImageUrl && (
              <>
                <div className='my-4 h-px bg-border' />
                <Button
                  variant='destructive'
                  className='w-full'
                  onClick={handleRemove}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Icon name='delete' className='mr-2' />
                  )}
                  Remove Current Picture
                </Button>
              </>
            )}
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a new photo or take one with your webcam.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureManager;
