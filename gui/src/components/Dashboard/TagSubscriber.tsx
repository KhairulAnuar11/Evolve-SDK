// src/components/Dashboard/TagSubscriber.tsx
import React, { useEffect, useContext } from 'react';
import { UF3SReader } from '@evolve/sdk';
import { TagContext } from '../../contexts/TagContext';
import { SDKEvent } from '@evolve/sdk';

interface TagSubscriberProps {
  reader: UF3SReader;
}

const TagSubscriber: React.FC<TagSubscriberProps> = ({ reader }) => {
  const { addTag } = useContext(TagContext);

  useEffect(() => {
    const bus = reader.getEventBus();

    // Handler function for TAG_DETECTED
    const handleTag = (data: { tagId: string; reader: any; timestamp: Date }) => {
      addTag({
        id: data.tagId,
        data: data.tagId,
        readerIp: data.reader.ip || 'Unknown',
        timestamp: data.timestamp,
      });
    };

    // Subscribe to TAG_DETECTED
    bus.on(SDKEvent.TAG_DETECTED, handleTag);

    // Cleanup subscription on unmount
    return () => {
      bus.off(SDKEvent.TAG_DETECTED, handleTag);
    };
  }, [reader, addTag]);

  return null; // No UI, just subscribes to events
};

export default TagSubscriber;
