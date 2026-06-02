export const triggerSecureDownload = async (mediaId: string, fallbackUrl: string) => {
  try {
    const res = await fetch(`/api/media/${mediaId}/download`);
    
    if (!res.ok) {
      throw new Error('Failed to fetch secure URL');
    }
    
    const data = await res.json();
    const finalUrl = data.url || fallbackUrl;

    // Direct navigation forces the download because we added fl_attachment to Cloudinary URL
    // This avoids CORS issues that block client-side fetch.
    const link = document.createElement('a');
    link.href = finalUrl;
    // Set target to _blank so it doesn't navigate the current page if it fails to attach
    link.target = '_blank';
    link.download = data.filename || `crowdcanvas_${mediaId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Download error:', error);
    
    // Fallback logic
    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.target = '_blank';
    link.download = `crowdcanvas_${mediaId}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
