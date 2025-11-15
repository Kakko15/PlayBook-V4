import { useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Button } from '@/components/ui/button';
import Icon from '@/components/Icon';

const videoConstraints = {
  width: 400,
  height: 400,
  facingMode: 'user',
};

const WebcamCapture = ({ onCapture, onCancel }) => {
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    onCapture(imageSrc);
  }, [webcamRef, onCapture]);

  return (
    <div className='flex flex-col items-center'>
      <div className='mb-4 overflow-hidden rounded-lg border'>
        <Webcam
          audio={false}
          height={400}
          width={400}
          ref={webcamRef}
          screenshotFormat='image/jpeg'
          videoConstraints={videoConstraints}
          mirrored={true}
        />
      </div>
      <div className='flex w-full justify-around'>
        <Button variant='ghost' onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={capture}>
          <Icon name='photo_camera' className='mr-2' />
          Take Photo
        </Button>
      </div>
    </div>
  );
};

export default WebcamCapture;
