import { useState, useRef, useCallback, useEffect } from 'react';
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
import toast from 'react-hot-toast';
import Icon from './Icon';

const MODEL_URL =
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model/';
const MIN_HUMAN_AGE = 5;

const ProfilePictureManager = ({ isOpen, onClose, onSuccess }) => {
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [mode, setMode] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  useEffect(() => {
    if (!isOpen) return;
    const loadModels = async () => {
      if (typeof faceapi === 'undefined') {
        toast.error('Face detection library failed to load. Please refresh.');
        return;
      }
      try {
        setModelsLoading(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ]);
      } catch (error) {
        console.error('Failed to load face-api models:', error);
        toast.error('Failed to load AI models for validation.');
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, [isOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
      }
      const url = URL.createObjectURL(file);
      setImage(url);
      setMode('edit');
    }
  };

  const handleWebcamCapture = (imageSrc) => {
    setImage(imageSrc);
    setMode('preview');
  };

  const runFaceDetection = async () => {
    if (!imageRef.current) {
      toast.error('Image element not found.');
      return false;
    }

    if (typeof faceapi === 'undefined') {
      toast.error('Face detection library not loaded.');
      return false;
    }

    await new Promise((resolve, reject) => {
      if (imageRef.current.complete) {
        resolve();
      } else {
        imageRef.current.onload = resolve;
        imageRef.current.onerror = reject;
      }
    });

    const detection = await faceapi
      .detectSingleFace(imageRef.current, new faceapi.TinyFaceDetectorOptions())
      .withAgeAndGender();

    if (!detection) {
      toast.error('No face detected. Please upload a clear photo of yourself.');
      return false;
    }

    const { age, gender } = detection;

    if (!gender) {
      toast.error('Please upload a photo of a human face.');
      return false;
    }

    if (age < MIN_HUMAN_AGE) {
      toast.error('Face detected appears to be too young.');
      return false;
    }

    toast.success('Human face detected successfully.');
    return true;
  };

  const handleSave = async () => {
    if (editorRef.current && imageRef.current) {
      setIsLoading(true);
      const isHuman = await runFaceDetection();
      if (!isHuman) {
        setIsLoading(false);
        return;
      }

      const canvas = editorRef.current.getImageScaledToCanvas();
      const imageBase64 = canvas.toDataURL('image/jpeg');

      onSuccess(imageBase64);
      handleClose();
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    onSuccess(null);
    handleClose();
  };

  const handleClose = () => {
    setImage(null);
    setScale(1.2);
    setMode('main');
    onClose();
  };

  const HiddenImage = () => (
    <img
      ref={imageRef}
      src={image}
      alt='hidden-processing-img'
      crossOrigin='anonymous'
      style={{ display: 'none' }}
    />
  );

  const handlePreviewConfirm = () => {
    setMode('edit');
  };

  const handlePreviewRetake = () => {
    setImage(null);
    setMode('webcam');
  };

  const renderContent = () => {
    switch (mode) {
      case 'edit':
        return (
          <>
            <HiddenImage />
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
              <Button
                onClick={handleSave}
                disabled={isLoading || modelsLoading}
              >
                {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {modelsLoading && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                {modelsLoading
                  ? 'Loading AI...'
                  : isLoading
                    ? 'Processing...'
                    : 'Apply'}
              </Button>
            </DialogFooter>
          </>
        );
      case 'preview':
        return (
          <div className='flex flex-col items-center space-y-4'>
            <div className='overflow-hidden rounded-lg border'>
              <img
                src={image}
                alt='Preview'
                className='h-[400px] w-[400px] object-cover'
              />
            </div>
            <div className='flex w-full justify-around'>
              <Button variant='ghost' onClick={handlePreviewRetake}>
                <Icon name='replay' className='mr-2' />
                Retake Photo
              </Button>
              <Button onClick={handlePreviewConfirm}>
                <Icon name='check' className='mr-2' />
                Use Photo
              </Button>
            </div>
          </div>
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
                disabled={modelsLoading}
              >
                {modelsLoading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icon name='upload_file' className='mr-2' />
                )}
                {modelsLoading ? 'Loading AI...' : 'Upload Image'}
              </Button>
              <Button
                variant='outline'
                onClick={() => setMode('webcam')}
                className='h-20'
                disabled={modelsLoading}
              >
                {modelsLoading ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Icon name='photo_camera' className='mr-2' />
                )}
                {modelsLoading ? 'Loading AI...' : 'Take Photo'}
              </Button>
            </div>
            <div className='my-4 h-px bg-border' />
            <Button
              variant='destructive'
              className='w-full'
              onClick={handleRemove}
              disabled={isLoading}
            >
              <Icon name='delete' className='mr-2' />
              Remove Current Picture
            </Button>
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
            {modelsLoading
              ? 'Loading AI models for face validation, please wait...'
              : 'Upload a new photo or take one. Only human faces are allowed.'}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureManager;
