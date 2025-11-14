import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Package, 
  Zap, 
  Building2, 
  FileText, 
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNotifications } from '../store/useStore';
import { FileUploadZone } from '../components/FileUploadZone';

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { addNotification } = useNotifications();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  console.log('🔍 ProductDetailsPage: Component loaded', { 
    id, 
    profile: profile?.role,
    currentPath: window.location.pathname,
    hasProfile: !!profile
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Simple query - load product directly
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
            
        if (error) {
          throw error;
        } else {
          setProduct(data);
        }
      } catch (error: any) {
        console.error('Errore nel caricare il prodotto:', error);
        addNotification({
          type: 'error',
          title: 'Errore',
          message: 'Impossibile caricare i dettagli del prodotto'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, addNotification]);

  const handleImageUpload = async (file: File) => {
    if (!product || !profile) return;

    try {
      setUploading(true);
      
      // Compress image before upload to reduce file size
      const { compressImage, blobToFile } = await import('../lib/imageUtils');
      const compressedBlob = await compressImage(file, 600, 0.35);
      const compressedFile = blobToFile(compressedBlob, `${product.id}_${Date.now()}.jpg`);

      // Upload to Supabase storage
      const fileName = `${product.id}/main.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, compressedFile, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName);

      // Update product with new image URL
      const { error: updateError } = await supabase
        .from('products')
        .update({ photo_url: publicUrl })
        .eq('id', product.id);

      if (updateError) throw updateError;

      // Update local state
      setProduct(prev => ({ ...prev, photo_url: publicUrl }));

      addNotification({
        type: 'success',
        title: 'Successo',
        message: 'Immagine caricata con successo'
      });
    } catch (error: any) {
      console.error('Errore nel caricare l\'immagine:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: 'Impossibile caricare l\'immagine'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: 'ST' | 'SDS') => {
    if (!product || !profile) return;

    try {
      setUploading(true);
      
      // proceed to upload
      
      // Upload to Supabase storage (bucket is public, no need to check existence)
      const fileName = `${documentType}.pdf`;
      const filePath = `${product.id}/${fileName}`;

      

      const { error: uploadError } = await supabase.storage
        .from('technical-data-sheets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      

      addNotification({
        type: 'success',
        title: 'Successo',
        message: `Documento ${documentType} caricato con successo`
      });
    } catch (error: any) {
      console.error(`Errore nel caricare il documento ${documentType}:`, error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: `Impossibile caricare il documento ${documentType}: ${error.message}`
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadST = async () => {
    if (!product) return;
    
    try {
      
      // Download ST file from storage
      const { data, error } = await supabase.storage
        .from('technical-data-sheets')
        .download(`${product.id}/ST.pdf`);

      if (error) {
        console.error('❌ Download error:', error);
        throw error;
      }

      

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ST_${product.name}_${product.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: 'Download completato',
        message: 'File ST scaricato con successo'
      });
    } catch (error: any) {
      console.error('Errore nel download ST:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: `Impossibile scaricare il file ST: ${error.message}`
      });
    }
  };

  const handleDownloadSDS = async () => {
    if (!product) return;
    
    try {
      
      // Download SDS file from storage
      const { data, error } = await supabase.storage
        .from('technical-data-sheets')
        .download(`${product.id}/SDS.pdf`);

      if (error) {
        console.error('❌ Download error:', error);
        throw error;
      }

      

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SDS_${product.name}_${product.code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addNotification({
        type: 'success',
        title: 'Download completato',
        message: 'File SDS scaricato con successo'
      });
    } catch (error: any) {
      console.error('Errore nel download SDS:', error);
      addNotification({
        type: 'error',
        title: 'Errore',
        message: `Impossibile scaricare il file SDS: ${error.message}`
      });
    }
  };

  const canViewDocuments = profile?.role === 'admin' || profile?.role === 'customer_user' || profile?.role === 'sales';
  const canUploadImage = profile?.role === 'admin' || profile?.role === 'production';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-2xl mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-300 font-medium">Caricamento dettagli prodotto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-2xl mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-300 mb-2">Prodotto non trovato</h3>
          <p className="text-gray-400 mb-4">Il prodotto richiesto non esiste o non hai i permessi per visualizzarlo.</p>
          <Button
            onClick={() => navigate('/garden')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Torna a Garden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-emerald-900 to-teal-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #10b981 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, #14b8a6 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, #06b6d4 1px, transparent 1px),
            linear-gradient(45deg, transparent 40%, rgba(16, 185, 129, 0.1) 50%, transparent 60%),
            linear-gradient(-45deg, transparent 40%, rgba(20, 184, 166, 0.1) 50%, transparent 60%)
          `,
          backgroundSize: '80px 80px, 100px 100px, 60px 60px, 120px 120px, 120px 120px'
        }} />
      </div>

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="mb-3">
          <Button
            onClick={() => navigate('/garden')}
            variant="outline"
            className="mb-2 bg-white/20 backdrop-blur-sm border-white/30 text-gray-300 hover:bg-white/30 h-7 text-xs"
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Torna a Garden
          </Button>
          
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white">{product.name} - Codice: {product.code}</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left side - Image and Upload Controls */}
          <div className="space-y-3">
            {/* Product Image */}
            <Card className="bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center text-base">
                  <ImageIcon className="w-3 h-3 mr-2" />
                  Immagine Prodotto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {product.photo_url ? (
                  <div className="relative">
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="w-full h-[600px] object-contain rounded-lg border border-white/20 bg-white/10"
                    />
                    {canViewDocuments && (
                      <div className="absolute top-2 right-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500/80 backdrop-blur-sm border-red-400/60 text-white hover:bg-red-500/90 h-6 text-xs px-2"
                          onClick={() => window.open(product.photo_url, '_blank')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download foto
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-24 h-[600px] flex flex-col items-center justify-center">
                    <ImageIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 text-sm">Nessuna immagine disponibile</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Side - Product Details and Documents */}
          <div className="space-y-3">
            {/* Product Details */}
            <Card className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center text-base font-bold">
                  <Package className="w-3 h-3 mr-2" />
                  Dettagli Prodotto
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {/* Prima riga: Codice + Categoria */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Codice Prodotto */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-1 mb-1">
                      <Package className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs font-bold text-gray-800">Codice</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {product.code}
                    </p>
                  </div>

                  {/* Categoria */}
                  {product.category && (
                    <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                      <div className="flex items-center space-x-1 mb-1">
                        <Building2 className="w-3 h-3 text-cyan-600" />
                        <span className="text-xs font-bold text-gray-800">Categoria</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{product.category}</p>
                    </div>
                  )}
                </div>

                {/* Nome Prodotto - Campo lungo */}
                <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                  <div className="flex items-center space-x-2 mb-1">
                    <Package className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">Nome Prodotto</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {product.name}
                  </p>
                </div>

                {/* Terza riga: Pezzi per Cartone + Pezzi per Pallet */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Cartone */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-1 mb-1">
                      <Package className="w-3 h-3 text-orange-600" />
                      <span className="text-xs font-bold text-gray-800">Pezzi/Cartone</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {product.cartone || 'N/A'}
                    </p>
                  </div>

                  {/* Pallet */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-1 mb-1">
                      <Package className="w-3 h-3 text-purple-600" />
                      <span className="text-xs font-bold text-gray-800">Pezzi/Pallet</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {product.pallet || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Quarta riga: Prezzo + Unità */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Prezzo */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-1 mb-1">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      <span className="text-xs font-bold text-gray-800">Prezzo</span>
                    </div>
                    <p className="text-base font-bold text-emerald-700">
                      €{product.base_price?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  {/* Strati */}
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-1 mb-1">
                      <Package className="w-3 h-3 text-teal-600" />
                      <span className="text-xs font-bold text-gray-800">Strati</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {product.strati !== null && product.strati !== undefined ? product.strati : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Brand - Campo lungo */}
                {product.brand_name && (
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <Building2 className="w-3 h-3 text-purple-600" />
                      <span className="text-xs font-bold text-gray-800">Brand</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{product.brand_name}</p>
                  </div>
                )}

                {/* Descrizione - Campo lungo */}
                {product.description && (
                  <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
                    <div className="flex items-center space-x-2 mb-1">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-gray-800">Descrizione</span>
                    </div>
                    <p className="text-xs text-gray-800 leading-tight font-medium">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section - Only for Admin and Customer */}
            {canViewDocuments && (
              <Card className="bg-white/50 backdrop-blur-xl border border-white/60 shadow-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center text-base font-bold">
                    <FileText className="w-3 h-3 mr-2" />
                    Documenti Tecnici
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      onClick={handleDownloadST}
                      className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-sm font-semibold"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Download ST
                    </Button>
                    
                    <Button
                      onClick={handleDownloadSDS}
                      className="h-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-green-500/25 transition-all duration-300 text-sm font-semibold"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Download SDS
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Controls - Horizontal layout with colored boxes */}
            {canUploadImage && (
              <div className="grid grid-cols-3 gap-3">
                {/* Carica Foto - Red Box */}
                <Card className="bg-red-500/20 backdrop-blur-xl border border-red-400/40 shadow-2xl">
                  <CardContent className="p-3">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-white">Carica Foto</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              addNotification({
                                type: 'error',
                                title: 'Errore',
                                message: 'File troppo grande. Dimensione massima: 5MB'
                              });
                              return;
                            }
                            handleImageUpload(file);
                          }
                        }}
                        className="hidden"
                        id="upload-photo"
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('upload-photo')?.click()}
                        disabled={uploading}
                        className="w-full bg-red-500/30 backdrop-blur-sm border-red-400/50 text-white hover:bg-red-500/40 h-7 text-xs"
                      >
                        {uploading ? '...' : 'Scegli'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Carica ST - Blue Box */}
                <Card className="bg-blue-500/20 backdrop-blur-xl border border-blue-400/40 shadow-2xl">
                  <CardContent className="p-3">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-white">Carica ST</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              addNotification({
                                type: 'error',
                                title: 'Errore',
                                message: 'File troppo grande. Dimensione massima: 10MB'
                              });
                              return;
                            }
                            handleDocumentUpload(file, 'ST');
                          }
                        }}
                        className="hidden"
                        id="upload-st"
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('upload-st')?.click()}
                        disabled={uploading}
                        className="w-full bg-blue-500/30 backdrop-blur-sm border-blue-400/50 text-white hover:bg-blue-500/40 h-7 text-xs"
                      >
                        {uploading ? '...' : 'Scegli'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Carica SDS - Green Box */}
                <Card className="bg-green-500/20 backdrop-blur-xl border border-green-400/40 shadow-2xl">
                  <CardContent className="p-3">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-white">Carica SDS</span>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              addNotification({
                                type: 'error',
                                title: 'Errore',
                                message: 'File troppo grande. Dimensione massima: 10MB'
                              });
                              return;
                            }
                            handleDocumentUpload(file, 'SDS');
                          }
                        }}
                        className="hidden"
                        id="upload-sds"
                        disabled={uploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('upload-sds')?.click()}
                        disabled={uploading}
                        className="w-full bg-green-500/30 backdrop-blur-sm border-green-400/50 text-white hover:bg-green-500/40 h-7 text-xs"
                      >
                        {uploading ? '...' : 'Scegli'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
