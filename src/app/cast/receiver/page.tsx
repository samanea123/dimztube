'use client';
import { useEffect } from 'react';

export default function ReceiverPage() {
  useEffect(() => {
    // Styling a bit to make it look like a receiver
    document.body.style.backgroundColor = 'black';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    const video = document.createElement('video');
    video.autoplay = true;
    video.controls = true;
    video.style.width = '100vw';
    video.style.height = '100vh';
    video.style.objectFit = 'contain';
    video.style.backgroundColor = 'black';
    document.body.appendChild(video);

    const messageDiv = document.createElement('div');
    messageDiv.textContent = 'Waiting for content...';
    messageDiv.style.position = 'absolute';
    messageDiv.style.top = '50%';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translate(-50%, -50%)';
    messageDiv.style.color = 'white';
    messageDiv.style.fontSize = '2rem';
    messageDiv.style.fontFamily = 'sans-serif';
    document.body.appendChild(messageDiv);


    // Saat terhubung dari sender
    if ((navigator as any).presentation && (navigator as any).presentation.receiver) {
      const receiver = (navigator as any).presentation.receiver;
      receiver.connectionList.then((list: any) => {
        list.connections.map((conn: any) => {
          conn.onmessage = (evt: any) => {
            console.log('📡 Data diterima:', evt.data);
            messageDiv.style.display = 'none';
            // Assuming the data is a video URL
            if (typeof evt.data === 'string' && evt.data.startsWith('http')) {
                video.src = evt.data;
                video.play();
            }
          };
        });
        
        list.onconnectionavailable = (event: any) => {
            const connection = event.connection;
            connection.onmessage = (evt: any) => {
                console.log('📡 Data diterima (new connection):', evt.data);
                messageDiv.style.display = 'none';
                if (typeof evt.data === 'string' && evt.data.startsWith('http')) {
                    video.src = evt.data;
                    video.play();
                }
            };
        };

      });
    }

    return () => {
        document.body.innerHTML = ''; // Clean up on unmount
    }
  }, []);

  return null;
}
