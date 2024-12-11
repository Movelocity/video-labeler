'use client'
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import ReactPlayer from 'react-player'
import BoxesLayer, { type BoxesLayerHandle } from '@/components/BoxesLayer';
import DynamicInputs from '@/components/DynamicInputs';
import { useWindowDimensions } from '@/components/videoPlayer/hooks/useWindowDimensions';
import { useVideoPlayer } from '@/components/videoPlayer/hooks/useVideoPlayer';
import { useKeyboardShortcuts } from '@/components/videoPlayer/hooks/useKeyboardShortcuts';
import { TimelineMarkers } from '@/components/videoPlayer/_partial/TimelineMarkers';
import { VideoControls } from '@/components/videoPlayer/_partial/VideoControls';
import { AnchorBox, LabelDataV2, LabelObject } from '@/common/types';
import { labelingService } from '@/service/labeling';
import { videoService } from '@/service/video';
import { second2time } from '@/lib/utils';
import { TimeLabelDetails } from '@/components/videoPlayer/_partial/TimeLabelDetails';

const time_diff_threshold = 0.005
const px = (n: number) => `${n}px`

const Player = (props: {filepath: string, label_file: string}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const videoPlayer = useVideoPlayer(videoService.getVideoUrl(props.filepath, props.label_file));
  const [labelText, setLabelText] = useState('');
  const boxesLayerRef = useRef<BoxesLayerHandle>(null);
  
  const [labelData, setLabelData] = useState<LabelDataV2>({
    metadata: {},
    objects: [],
    version: 2
  });

  // 计算视频组件的尺寸
  const calculateVideoSize = useCallback(() => {
    const maxWidth = windowWidth * 0.7; // 视频最大宽度为窗口宽度的70%
    const maxHeight = windowHeight * 0.7; // 视频最大高度为窗口高度的70%
    
    let videoWidth = maxWidth;
    let videoHeight = videoWidth / videoPlayer.videoShapeRatio;

    if (videoHeight > maxHeight) {
      videoHeight = maxHeight;
      videoWidth = videoHeight * videoPlayer.videoShapeRatio;
    }

    return { width: videoWidth, height: videoHeight };
  }, [windowWidth, windowHeight, videoPlayer.videoShapeRatio]);
  const videoSize = calculateVideoSize();

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [activeProgress, setActiveProgress] = useState(0);
  
  const updateProgressView = useCallback((fraction:number)=> {
    videoPlayer.seekTo(fraction);
    setActiveProgress(fraction);
  }, [videoPlayer])

  const updateProgress = useCallback((clientX:number)=> {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;
    const fraction = Math.min(Math.max(x / width, 0), 1);
    updateProgressView(fraction);
  }, [updateProgressView])

  useEffect(() => {
    setActiveProgress(videoPlayer.progress);
  }, [videoPlayer.progress]);

  const [hasWindow, setHasWindow] = useState(false);
  const hasInit = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !hasInit.current) {
      console.log('init')
      setHasWindow(true);
      
      labelingService.readLabelsV2(props.filepath, props.label_file)
        .then(data => {
          setLabelData(data);
        })
        .catch(error => {
          console.error('read_label:', error);
        });
      hasInit.current = true;
    }
  }, [props.filepath, props.label_file]);

  const saveCurrentLabeling = useCallback(() => {
    console.log('save current labeling')
    const boxes = boxesLayerRef.current?.getBoxes() || [];
    if(boxes.length === 0) return;
    
    // 将新的标注框按标签分组
    const boxesByLabel = new Map<string, AnchorBox>();
    boxes.forEach(box => {
      const baseLabel = box.label.replace(/_(开始|结束)$/, '');
      boxesByLabel.set(baseLabel, box);
    });

    // 准备更新对象
    const object_updates: LabelObject[] = Array.from(boxesByLabel.entries()).map(([baseLabel, box]) => ({
      label: baseLabel,
      timeline: {
        [activeProgress.toString()]: box
      }
    }));

    // 更新状态
    setLabelData(prev => {
      const newObjects = [...prev.objects];
      
      object_updates.forEach(update => {
        const existingIndex = newObjects.findIndex(obj => obj.label === update.label);
        if (existingIndex !== -1) {
          // 更新现有对象的时间线
          newObjects[existingIndex] = {
            ...newObjects[existingIndex],
            timeline: {
              ...newObjects[existingIndex].timeline,
              ...update.timeline
            }
          };
        } else {
          // 添加新对象
          newObjects.push(update);
        }
      });

      return {
        ...prev,
        objects: newObjects
      };
    });

    // 保存到服务器
    labelingService.saveLabelingV2({
      video_name: props.filepath,
      object_updates
    }, props.label_file);
  }, [activeProgress, boxesLayerRef.current?.getBoxes(), props.filepath, props.label_file]);
  
  const deleteCurrentLabeling = useCallback(() => {
    console.log('delete current labeling');
    
    // 获取当前时间点的所有标签
    const currentBoxes = boxesLayerRef.current?.getBoxes() || [];
    const labelsToDelete = new Set(currentBoxes.map(box => box.label.replace(/_(开始|结束)$/, '')));

    // 更新状态
    setLabelData(prev => {
      const newObjects = prev.objects.map(obj => {
        if (labelsToDelete.has(obj.label)) {
          // 删除该时间点的标注
          const newTimeline = { ...obj.timeline };
          Object.keys(newTimeline).forEach(time => {
            if (Math.abs(parseFloat(time) - activeProgress) < time_diff_threshold) {
              delete newTimeline[time];
            }
          });
          return { ...obj, timeline: newTimeline };
        }
        return obj;
      }).filter(obj => Object.keys(obj.timeline).length > 0); // 移除空的对象

      return {
        ...prev,
        objects: newObjects
      };
    });

    // 删除服务器数据
    Promise.all(Array.from(labelsToDelete).map(label =>
      labelingService.deleteLabelingV2({
        video_name: props.filepath,
        label,
        time: activeProgress
      }, props.label_file)
    ));

    boxesLayerRef.current?.setBoxes([]);
  }, [activeProgress, props.filepath, props.label_file]);

  // Add keyboard shortcuts
  useKeyboardShortcuts({
    togglePlay: videoPlayer.togglePlay,
    stepForward: videoPlayer.stepForward,
    stepBackward: videoPlayer.stepBackward,
    saveCurrentLabeling,
    deleteCurrentLabeling,
  });

  const [selectedObject, setSelectedObject] = useState<string | undefined>();

  return (
    <div className='flex flex-row pt-4'>
      <div className='mx-auto flex flex-col h-full' style={{width: px(videoSize.width)}}>
        <div className='relative bg-gray-500 select-none' style={{height: px(videoSize.height)}}>
          { hasWindow && 
            <ReactPlayer
              ref={videoPlayer.playerRef}
              className='absolute top-0 left-0'
              url={videoPlayer.url}
              width='100%'
              height='100%'
              playing={videoPlayer.playing}
              loop={false}
              controls={false}
              onProgress={videoPlayer.handleProgress}
              onReady={videoPlayer.handleReady}
            />
          }
          <BoxesLayer 
            className='absolute top-0 left-0' 
            width={videoSize.width} 
            height={videoSize.height} 
            labeltext={labelText}
            ref={boxesLayerRef}
          />
        </div>

        <div className='' style={{width: px(videoSize.width)}}>
          <div className='text-slate-300 text-xs w-full flex flex-row justify-between mb-1'>
            <span>00:00</span>
            <span>{second2time(videoPlayer.duration*0.25)}</span>
            <span>{second2time(videoPlayer.duration*0.75)}</span>
            <span>{second2time(videoPlayer.duration)}</span>
          </div>

          <TimelineMarkers 
            labelData={labelData}
            duration={videoPlayer.duration}
            onMarkerClick={(time, boxes) => {
              boxesLayerRef.current?.setBoxes(boxes)
              updateProgressView(time)
            }}
            selectedObject={selectedObject}
          />

          <div
            className='relative h-4 w-full rounded-sm overflow-hidden'
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {updateProgress(e.clientX)}}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(activeProgress * 100)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') updateProgressView(Math.min(1, activeProgress + 0.01));
              if (e.key === 'ArrowLeft') updateProgressView(Math.max(0, activeProgress - 0.01));
            }}
          >
            <div className='absolute inset-0 bg-slate-700' ref={progressBarRef} />
            <div 
              className='absolute inset-y-0 left-0 bg-slate-400 transition-all duration-100'
              style={{width: `${activeProgress * 100}%`}}
            />
            <div
              className='absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white'
              style={{left: `${activeProgress * 100}%`, transform: `translateX(-50%) translateY(-50%)`}}
            />
          </div>
        </div>
            
        <VideoControls 
          playing={videoPlayer.playing}
          duration={videoPlayer.duration}
          currentTime={videoPlayer.duration * activeProgress}
          onTogglePlay={videoPlayer.togglePlay}
          onSave={saveCurrentLabeling}
          onDelete={deleteCurrentLabeling}
        />
      </div>
      <div className='flex flex-col h-full pr-12 '>
        <DynamicInputs onSelectText={setLabelText}/>

        <TimeLabelDetails
          labelData={labelData}
          duration={videoPlayer.duration}
          onMarkerClick={(time, boxes) => {
            boxesLayerRef.current?.setBoxes(boxes)
            updateProgressView(time)
          }}
          activeTime={activeProgress}
          selectedObject={selectedObject}
          onObjectSelect={setSelectedObject}
        />
      </div>
    </div>
  );
}

Player.displayName = "Player"
export default memo(Player)