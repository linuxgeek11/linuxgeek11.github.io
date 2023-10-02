function documentReady(callback) {
  if (document.readyState !== 'loading') {
    callback();
  } else {
    document.addEventListener('DOMContentLoaded', () => callback());
  }
}

documentReady(function() {
  new SimpleLightbox(
    '.lb',
    {
      captionsData: 'alt',
      overlay: true,
      overlayOpacity: 0.9,
    }
  );
});
