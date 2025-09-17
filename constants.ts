
export const ASPECT_RATIO_GROUPS = {
  landscape: [
    { label: '1:1', value: '1:1', width: 1024, height: 1024 },
    { label: '5:4', value: '5:4', width: 1024, height: 832 },
    { label: '4:3', value: '4:3', width: 1024, height: 768 },
    { label: '3:2', value: '3:2', width: 1152, height: 768 },
    { label: '16:9', value: '16:9', width: 1344, height: 768 },
    { label: '21:9', value: '21:9', width: 1472, height: 640 },
  ],
  portrait: [
    { label: '4:5', value: '4:5', width: 832, height: 1024 },
    { label: '3:4', value: '3:4', width: 768, height: 1024 },
    { label: '2:3', value: '2:3', width: 768, height: 1152 },
    { label: '9:16', value: '9:16', width: 768, height: 1344 },
    { label: '9:21', value: '9:21', width: 640, height: 1472 },
  ],
};

export const ASPECT_RATIOS = [...ASPECT_RATIO_GROUPS.landscape, ...ASPECT_RATIO_GROUPS.portrait];
