// TEMPORARY DEBUG VERSION - Replace toggleImageSelection function with this:

const toggleImageSelection = (image, isLeft) => {
    console.log('🔵 toggleImageSelection called');
    console.log('  Image:', image.date);
    console.log('  isLeft:', isLeft);
    console.log('  Current selectedLeft:', selectedLeft.map(img => img.date));
    console.log('  Current selectedRight:', selectedRight.map(img => img.date));
    
    const setArray = isLeft ? setSelectedLeft : setSelectedRight;
    const currentArray = isLeft ? selectedLeft : selectedRight;
    const setIndexFunc = isLeft ? setLeftCollectionIndex : setRightCollectionIndex;

    console.log('  Current collection:', currentArray.map(img => img.date));
    
    const imageExists = currentArray.some(img => img.date === image.date);
    console.log('  Image exists in collection:', imageExists);
    
    if (imageExists) {
        console.log('  ❌ Removing from collection');
        // Toggle off - remove from collection
        const newArray = currentArray.filter(img => img.date !== image.date);
        console.log('  New array after removal:', newArray.map(img => img.date));
        
        if (newArray.length > 0) {
            setArray(newArray);
            setIndexFunc(0);
            console.log('  ✅ Collection updated');
        } else {
            console.log('  ⚠️ Cannot remove - would be empty');
            toast.error('Collection must have at least one image');
        }
    } else {
        console.log('  ✅ Adding to collection');
        const newArray = [...currentArray, image].sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log('  New array after addition:', newArray.map(img => img.date));
        
        setArray(newArray);
        const newIndex = newArray.findIndex(img => img.date === image.date);
        console.log('  New index:', newIndex);
        setIndexFunc(newIndex >= 0 ? newIndex : 0);
        console.log('  ✅ Collection updated');
    }
    
    console.log('🔵 toggleImageSelection complete\n');
};
