export const AdBanner = () => {
  return (
    <div 
      id="frame" 
      style={{ 
        width: '100%', 
        margin: 'auto', 
        position: 'relative', 
        zIndex: 99998 
      }}
    >
      <iframe 
        data-aa='2417417' 
        src='//acceptable.a-ads.com/2417417/?size=Adaptive'
        style={{
          border: 0, 
          padding: 0, 
          width: '70%', 
          height: 'auto', 
          overflow: 'hidden', 
          display: 'block', 
          margin: 'auto'
        }}
        title="Advertisement"
      />
    </div>
  );
};
