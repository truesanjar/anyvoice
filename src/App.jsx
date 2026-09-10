import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  Link,
  useLocation
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Login from './authentication/login';
import SignUp from './authentication/signup';
import ForgotPassword from './authentication/forgot_password';
import MainMenu from './menu/menu';
import UserAccount from './account/acount';
import ShopingLoader from './shoping/ShopingLoader';
import ChatUI from './home/chat';
import EditProfile from './account/EditProfile';
import SavedPosts from './account/SavedPosts';
import SupportedPosts from './account/SupportedPosts';
import PurchasedProducts from './account/PurchasedProducts';
import LikedStores from './account/LikedStores';
import ReactionToTheories from './account/ReactionToTheories';
import CommentsPosted from './account/CommentsPosted';
import VideoLoader from './explore/VideoLoader';
import ImageLoader from './explore/ImageLoader';
import ProductLoader from './shoping/ProductLoader';
import TheoryLoader from './dispute/theory/TheoryLoader';
import ImageUploader from './account/create/ImageUploader';
import VideoUploader from './account/create/VideoUploader';
import ProductUploader from './account/create/ProductUploader';
import ShopUploader from './account/create/ShopUploader';
import TheoryUploader from './account/create/TheoryUploader';
import ArticleItem from './dispute/article/ArticleItem';
import SavedLikedArticles from './account/SavedLikedArticles';
import CreateArticleModalComponent from './dispute/article/CreateArticleModalComponent';
import { setSecureToken, getSecureToken, removeSecureToken } from './authentication/secureStorage';
import Privacy from './Privacy';
import { Analytics } from '@vercel/analytics/react';

const BACKEND_URL = "https://api.anyvoice.world";

// Компоненти умумии нишон додани хатогӣ
const ErrorDisplay = ({ error, onBack, t }) => (
  <div
    style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#303030',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '30px'
    }}
  >
    <div
      style={{
        color: 'red',
        fontSize: '32px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}
    >
      {error}
    </div>

    <button
      onClick={onBack}
      style={{
        padding: '12px 25px',
        fontSize: '16px',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      {t('app.back')}
    </button>
  </div>
);

// Компоненти умумии бозгашт
const BackButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        fontSize: '2rem',
        color: isHovered ? '#115293' : '#1976d2',
        cursor: 'pointer',
        zIndex: 1,
        border: 'none',
        outline: 'none',
        transition: 'color 0.2s'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      ←
    </button>
  );
};

// Компоненти умумии контейнер
const Container = ({ children, fullContainerRef = null }) => (
  <div
    ref={fullContainerRef}
    style={{
      width: '100%',
      height: '100vh',
      overflowY: 'auto',
      backgroundColor: '#303030',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}
  >
    {children}
  </div>
);

// Функсияи умумии санҷиши пост
const usePostCheck = (link, endpoint, params = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkPost = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link, ...params })
        });

        if (!response.ok) {
          const statusMap = {
            403: 'blocked',
            405: 'not_in_store',
            406: 'wrong_link',
            404: 'not_found'
          };
          setError(statusMap[response.status] || 'unknown');
          return;
        }

        const data = await response.json();
        setData(data);
      } catch (err) {
        setError('unknown');
      }
    };

    if (link) checkPost();
  }, [link, endpoint]);

  return { data, error };
};

// Компоненти умумии нишон додани мағоза
const ShopDisplay = memo(({ shopData, fullContainerRef, navigate, t }) => (
  <Container fullContainerRef={fullContainerRef}>
    <BackButton onClick={() => navigate('/')} />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 400px)',
        justifyContent: 'center',
        maxWidth: '1000px',
        margin: '0 auto',
        gridAutoRows: 'auto',
        alignItems: 'start'
      }}
    >
      <div 
        style={{ 
          transition: 'transform 0.2s ease',
          height: '100%'
        }}
        className="shoping-card-container"
      >
        <ProtectedRoute>
          <ShopingLoader
            shopingId={shopData._id}
            userIdOfShoping={shopData.shoping_user_id}
            fullContainerRef={fullContainerRef}
          />
        </ProtectedRoute>
      </div>
    </div>
  </Container>
));

// Компоненти умумии нишон додани пост (видео, расм, маҳсул, назария)
const PostDisplay = memo(({ 
  type, 
  data, 
  fullContainerRef, 
  navigate,
  Component 
}) => (
  <Container fullContainerRef={fullContainerRef}>
    <BackButton onClick={() => navigate('/')} />
    <div style={{ width: '400px' }}>
      <ProtectedRoute>
        <Component
          {...{[`${type}Id`]: data[`${type}_id`]}}
          backendUrl={BACKEND_URL}
          {...{[`userIdOf${type.charAt(0).toUpperCase() + type.slice(1)}`]: data[`${type}_user_id`]}}
          fullContainerRef={fullContainerRef}
        />
      </ProtectedRoute>
    </div>
  </Container>
));

// Wrapper барои мағоза
const ShopingUIWrapper = ({ shopname: propShopname }) => {
  const navigate = useNavigate();
  const params = useParams();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();
  
  const shopname = decodeURIComponent(propShopname || params.shopname || '');
  const { data: shopingData, error } = usePostCheck(shopname, 'check-shoping', { shoping_name: shopname });

  if (error) {
    const errorMessage = error === 'not_found' ? t('app.errors.storeNotFound') : t('app.errors.storeError');
    return <ErrorDisplay error={errorMessage} onBack={() => navigate('/')} t={t} />;
  }

  if (!shopingData) return null;

  return (
    <ShopDisplay 
      shopData={shopingData} 
      fullContainerRef={fullContainerRef} 
      navigate={navigate} 
      t={t}
    />
  );
};

// Wrapper барои видео
const VideoLinkWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();

  const videoPath = location.pathname.split('/video/')[1] || '';
  const videoLink = decodeURIComponent(videoPath);

  const { data: videoData, error } = usePostCheck(videoLink, 'check-link-video');

  if (error) {
    const errorMap = {
      blocked: t('app.errors.videoBlocked'),
      wrong_link: t('app.errors.videoWrongLink'),
      unknown: t('app.errors.videoError')
    };

    return (
      <ErrorDisplay
        error={errorMap[error] || errorMap.unknown}
        onBack={() => navigate('/')}
        t={t}
      />
    );
  }

  if (!videoData) return null;

  return (
    <PostDisplay
      type="video"
      data={videoData}
      fullContainerRef={fullContainerRef}
      navigate={navigate}
      Component={VideoLoader}
    />
  );
};

// Wrapper барои расм
const ImageLinkWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();

  const imagePath = location.pathname.split('/image/')[1] || '';
  const imageLink = decodeURIComponent(imagePath);

  const { data: imageData, error } = usePostCheck(imageLink, 'check-link-image');

  if (error) {
    const errorMap = {
      blocked: t('app.errors.imageBlocked'),
      wrong_link: t('app.errors.imageWrongLink'),
      unknown: t('app.errors.imageError')
    };

    return (
      <ErrorDisplay
        error={errorMap[error] || errorMap.unknown}
        onBack={() => navigate('/')}
        t={t}
      />
    );
  }

  if (!imageData) return null;

  return (
    <PostDisplay
      type="image"
      data={imageData}
      fullContainerRef={fullContainerRef}
      navigate={navigate}
      Component={ImageLoader}
    />
  );
};

// Wrapper барои маҳсул
const ProductLinkWrapper = ({ userId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();

  const productLink = decodeURIComponent(`https://www.anyvoice.world/${location.pathname.substring(1)}`);
  const { data: productData, error } = usePostCheck(productLink, 'check-link-product', { user_id: userId });

  if (error) {
    const errorMap = {
      blocked: t('app.errors.productBlocked'),
      wrong_link: t('app.errors.productWrongLink'),
      not_in_store: t('app.errors.productNotInStore'),
      not_found: t('app.errors.productNotFound'),
      unknown: t('app.errors.productError')
    };
    return <ErrorDisplay error={errorMap[error] || errorMap.unknown} onBack={() => navigate('/')} t={t} />;
  }

  if (!productData) return null;

  return (
    <PostDisplay 
      type="product"
      data={productData}
      fullContainerRef={fullContainerRef}
      navigate={navigate}
      Component={ProductLoader}
    />
  );
};

// Wrapper барои назария
const TheoryLinkWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();

  const theoryLink = decodeURIComponent(location.pathname.substring(8));
  const { data: theoryData, error } = usePostCheck(theoryLink, 'check-link-theory');

  if (error) {
    const errorMap = {
      blocked: t('app.errors.theoryBlocked'),
      wrong_link: t('app.errors.theoryWrongLink'),
      not_found: t('app.errors.theoryNotFound'),
      unknown: t('app.errors.theoryError')
    };
    return <ErrorDisplay error={errorMap[error] || errorMap.unknown} onBack={() => navigate('/')} t={t} />;
  }

  if (!theoryData) return null;

  return (
    <PostDisplay 
      type="theory"
      data={theoryData}
      fullContainerRef={fullContainerRef}
      navigate={navigate}
      Component={TheoryLoader}
    />
  );
};

// Wrapper барои мақола
const ArticleLoader = ({ articleId, backendUrl, userId }) => {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadArticle = useCallback(async () => {
    try {
      setArticle(articleId);
    } catch (err) {
      console.error('Error loading article:', err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, articleId, userId]);

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  if (loading) return <div className="article-placeholder">Loading...</div>;
  if (!article) return null;

  return (
    <ArticleItem
      articleId={article} 
      backendUrl={backendUrl}
      userId={userId}
    />
  );
};

const ArticleLinkWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();

  const { link } = useParams();

  const { data: articleData, error } = usePostCheck(
    link,
    'check-link-article'
  );

  if (error) {
    return (
      <ErrorDisplay
        error={t('app.errors.articleError')}
        onBack={() => navigate('/')}
        t={t}
      />
    );
  }

  if (!articleData) return null;

  return (
    <>
      <PostDisplay
        type="article"
        data={articleData}
        fullContainerRef={fullContainerRef}
        navigate={navigate}
        Component={(props) => (
          <ArticleLoader 
            {...props}
          />
        )}
      />
    </>
  );
};

// Wrapper барои чат
const ChatUIWrapper = memo(() => {
  const params = useParams();
  const username = params.username ? decodeURIComponent(params.username) : '';
  
  return (
    <ProtectedRoute>
      <ChatUI backendUrl={BACKEND_URL} username_of_interlocutor={username} />
    </ProtectedRoute>
  );
});

// Компонент барои эҷоди пост
const AddPost = memo(({ myUsername, userId, backendUrl }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hoveredType, setHoveredType] = useState(null);

  const postTypes = [
    { id: 'image', label: t('app.createPost.types.image'), icon: '🖼️', path: '/create/image' },
    { id: 'video', label: t('app.createPost.types.video'), icon: '🎥', path: '/create/video' },
    { id: 'article', label: t('app.createPost.types.article') || 'Article', icon: '📝', path: '/create/article' }
  ];

  return (
    <>
      <div
        style={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: '#303030',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}
      >
        <BackButton onClick={() => navigate(`/@${myUsername}`)} />

        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#424242',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}
        >
          <h1
            style={{
              color: '#ffffff',
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
              fontWeight: '600'
            }}
          >
            {t('app.createPost.title')}
          </h1>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}
          >
            {postTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => navigate(type.path)}
                onMouseEnter={() => setHoveredType(type.id)}
                onMouseLeave={() => setHoveredType(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '24px 16px',
                  backgroundColor: hoveredType === type.id ? '#505050' : '#303030',
                  border: hoveredType === type.id ? '2px solid #1976d2' : '2px solid transparent',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '500',
                  outline: 'none',
                  transform: hoveredType === type.id ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredType === type.id ? '0 8px 12px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                <span style={{ fontSize: '3rem' }}>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});

// Wrapper барои таҳрири мақола
const UpdateImageWrapper = () => {
  const { link } = useParams();
  return (
    <ProtectedRoute>
      <ImageUploader link={link} />
    </ProtectedRoute>
  );
};

const UpdateVideoWrapper = () => {
  const { link } = useParams();
  return (
    <ProtectedRoute>
      <VideoUploader link={link} />
    </ProtectedRoute>
  );
};

const UpdateProductWrapper = () => {
  const { link } = useParams();
  return (
    <ProtectedRoute>
      <ProductUploader link={`https://www.anyvoice.world/product/${link}`} />
    </ProtectedRoute>
  );
};

const UpdateShopWrapper = () => {
  const navigate = useNavigate();
  const fullContainerRef = useRef(null);
  const { t } = useTranslation();
  const { shopname } = useParams();
  
  const { data: shopingData, error } = usePostCheck(shopname, 'check-shoping', { shoping_name: shopname });

  if (error) {
    const errorMessage = error === 'not_found' ? t('app.errors.storeNotFound') : t('app.errors.storeError');
    return <ErrorDisplay error={errorMessage} onBack={() => navigate('/')} t={t} />;
  }

  if (!shopingData) return null;

  return (
    <Container fullContainerRef={fullContainerRef}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 400px)',
          justifyContent: 'center',
          maxWidth: '1000px',
          margin: '0 auto',
          gridAutoRows: 'auto',
          alignItems: 'start'
        }}
      >
        <div 
          style={{ 
            transition: 'transform 0.2s ease',
            height: '100%'
          }}
          className="shoping-card-container"
        >
          <ProtectedRoute>
            <ShopUploader 
              shopingName={shopname}
              shopingId={shopingData._id}
            />
          </ProtectedRoute>
        </div>
      </div>
    </Container>
  );
};

// ==================== STATUS WEBSOCKET ====================

const StatusWebSocket = ({ userId }) => {
  const statusWsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectStatusWebSocket = useCallback(() => {
    if (!userId) return;

    if (statusWsRef.current) {
      try {
        statusWsRef.current.close();
      } catch (e) {}
    }

    const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const backendHost = BACKEND_URL.replace('http://', '').replace('https://', '');
    const wsUrl = `${wsScheme}${backendHost}/ws/status/${userId}`;

    const ws = new WebSocket(wsUrl);
    statusWsRef.current = ws;

    ws.onopen = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') {
        } else if (data.type === 'user_status_change') {
        }
      } catch (error) {
        console.error('Error parsing status message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Status WebSocket error:', error);
    };

    ws.onclose = (event) => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (userId) {
          connectStatusWebSocket();
        }
      }, 5000);
    };
  }, [userId]);

  useEffect(() => {
    connectStatusWebSocket();

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (statusWsRef.current) {
        statusWsRef.current.close();
      }
    };
  }, [connectStatusWebSocket]);

  return null;
};

// ==================== PROTECTED ROUTE ====================

const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState({ 
    isAuthenticated: null, 
    userData: null, 
    loading: true,
    error: null
  });
  const isMountedRef = useRef(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showBannedPopup, setShowBannedPopup] = useState(false);

  const checkAuth = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const token = await getSecureToken();
      
      if (!token) {
        if (isMountedRef.current) {
          setAuthState({ 
            isAuthenticated: false, 
            userData: null, 
            loading: false,
            error: null
          });
        }
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${BACKEND_URL}/verify-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!isMountedRef.current) return;

        if (response.ok) {
          const data = await response.json();

          if (!data.user_id) {
            await removeSecureToken();
            setAuthState({
              isAuthenticated: false,
              userData: null,
              loading: false,
              error: null
            });
            return;
          }

          if (data.token_refreshed && data.new_token) {
            await setSecureToken(data.new_token);
          }

          const userResponse = await fetch(`${BACKEND_URL}/get-user-info/${data.user_id}`);
          if (userResponse.ok) {
            const uData = await userResponse.json();
            if (uData.is_banned) {
              setShowBannedPopup(true);
              setAuthState({
                isAuthenticated: null,
                userData: null,
                loading: false,
                error: null
              });
              return;
            }
            setAuthState({
              isAuthenticated: true,
              userData: {
                userId: data.user_id,
                username: uData.username,
                display: uData.display,
                avatar: uData.avatar ? `data:image/jpeg;base64,${uData.avatar}` : null
              },
              loading: false,
              error: null
            });
          } else {
            throw new Error('failed_to_fetch_user_info');
          }
        } else if (response.status === 404 || response.status === 400) {
          await removeSecureToken();
          
          if (isMountedRef.current) {
            setAuthState({ 
              isAuthenticated: false, 
              userData: null, 
              loading: false,
              error: null
            });
          }
        } else {
          navigate("/login", { replace: true });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('timeout');
        }
        throw fetchError;
      }
    } catch (err) {
      console.error('Auth check error:', err);
      
      if (!isMountedRef.current) return;
      
      let errorKey = 'connection_error';
      if (err.message === 'timeout') {
        errorKey = 'timeout';
      } else if (err.message === 'failed_to_fetch_user_info') {
        errorKey = 'failed_to_fetch_user_info';
      } else if (err.message === 'server_error') {
        errorKey = 'server_error';
      } 
      
      setAuthState({ 
        isAuthenticated: null, 
        userData: null, 
        loading: false,
        error: errorKey
      });
    }
  }, []);

  const handleBannedConfirm = async () => {
    await removeSecureToken();
    setShowBannedPopup(false);
    navigate("/login", { replace: true });
  };

  const handleRetry = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    setTimeout(() => checkAuth(), 100);
  }, [checkAuth]);

  useEffect(() => {
    isMountedRef.current = true;
    checkAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, [checkAuth]);

  if (authState.loading) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        backgroundColor: '#303030',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #555',
          borderTop: '4px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div style={{ color: '#fff', fontSize: '16px' }}>
          {t('app.loading')}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (authState.error && !authState.loading && authState.isAuthenticated === null) {
    return (
      <div style={{ 
        width: '100%',
        height: '100vh',
        backgroundColor: '#303030',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '30px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{
            color: '#ff6b6b',
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            ⚠️
          </div>
          <div style={{
            color: '#ff6b6b',
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            {t(`app.auth.errors.${authState.error}`, t('app.auth.errors.default'))}
          </div>
        </div>
        
        <button
          onClick={handleRetry}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1565c0'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#1976d2'}
        >
          {t('app.auth.retry_button')}
        </button>
      </div>
    );
  }

  if (showBannedPopup) {
    return (
      <div style={{
        width: "100%",
        minHeight: "100vh",
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>
        <div style={{
          maxWidth: "520px",
          width: "100%",
          background: "#1f1f1f",
          borderRadius: "20px",
          padding: "35px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "100px",
              color: "#ff4d4f",
              marginBottom: "20px",
              display: "block"
            }}
          >
            block
          </span>

          <h2 style={{
            color: "#ff4d4f",
            marginBottom: "15px"
          }}>
            {t("app.banned.title")}
          </h2>

          <p style={{
            color: "#ddd",
            lineHeight: "1.7",
            marginBottom: "20px",
            fontSize: "16px"
          }}>
            {t("app.banned.description")}
          </p>

          <a
            href="mailto:llcsanjar@gmail.com"
            className="contact-email"
            style={{
              color: "#4da6ff",
              fontSize: "17px",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "25px"
            }}
          >
            llcsanjar@gmail.com
          </a>

          <button
            onClick={handleBannedConfirm}
            style={{
              marginTop: "15px",
              padding: "12px 30px",
              border: "none",
              borderRadius: "10px",
              background: "#ff4d4f",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            {t("app.banned.button")}
          </button>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (authState.isAuthenticated && authState.userData) {
    return (
      <>
        <StatusWebSocket userId={authState.userData.userId} />
        
        {React.cloneElement(children, { 
          backendUrl: BACKEND_URL,
          userId: authState.userData.userId,
          userIdFromMe: authState.userData.userId,
          username: authState.userData.username,
          myUsername: authState.userData.username,
          display: authState.userData.display,
          myDisplay: authState.userData.display,
          avatar: authState.userData.avatar,
          avatarPath: authState.userData.avatar,
        })}
      </>
    );
  }

  return null;
};

// ==================== HANDLER БАРОИ РОУТҲОИ МАХСУС ====================

const SpecialRouteHandler = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  if (pathname.startsWith('/@')) {
    const username = pathname.substring(2);
    return (
      <div>
        <button 
          className="back-from-account-button"
          onClick={() => navigate('/')}
          title={t('account.back')}
        >
          ←
        </button>

        <ProtectedRoute>
          <UserAccount key={username} backendUrl={BACKEND_URL} profileUsername={username} />
        </ProtectedRoute>
      </div>
    );
  }

  if (pathname.startsWith('/chats/@')) {
    const username = pathname.substring(8);
    return (
      <ProtectedRoute>
        <ChatUI backendUrl={BACKEND_URL} username_of_interlocutor={username} />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>{t('app.errors.pageNotFound')}</h2>
        <p>{t('app.errors.pageNotFoundDesc')}</p>
        <Link 
          to="/" 
          style={{
            display: 'inline-block',
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '5px',
            textDecoration: 'none'
          }}
        >
          {t('app.back')}
        </Link>
      </div>
    </ProtectedRoute>
  );
};

// ==================== КОМПОНЕНТИ АСОСӢ ====================

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login backendUrl={BACKEND_URL} />} />
        <Route path="/signup" element={<SignUp backendUrl={BACKEND_URL} />} />
        <Route path="/forgot_password" element={<ForgotPassword backendUrl={BACKEND_URL} />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
        <Route path="/saved-posts" element={<ProtectedRoute><SavedPosts /></ProtectedRoute>} />
        <Route path="/supported-posts" element={<ProtectedRoute><SupportedPosts /></ProtectedRoute>} />
        <Route path="/comments-posted" element={<ProtectedRoute><CommentsPosted /></ProtectedRoute>} />
        <Route path="/saved-liked-articles" element={<ProtectedRoute><SavedLikedArticles /></ProtectedRoute>} />
        
        <Route path="/create" element={<ProtectedRoute><AddPost /></ProtectedRoute>} />
        <Route path="/chats" element={<ProtectedRoute><ChatUI backendUrl={BACKEND_URL} /></ProtectedRoute>} />
        <Route path="/chats/@:username" element={<ChatUIWrapper />} />
        
        <Route path="/video/:link" element={<VideoLinkWrapper />} />
        <Route path="/image/:link" element={<ImageLinkWrapper />} />
        <Route path="/article/:link" element={<ArticleLinkWrapper />} />
        
        <Route path="/create/image" element={<ProtectedRoute><ImageUploader /></ProtectedRoute>} />
        <Route path="/create/video" element={<ProtectedRoute><VideoUploader /></ProtectedRoute>} />
        <Route path="/create/article" element={<ProtectedRoute><CreateArticleModalComponent /></ProtectedRoute>} />
        
        <Route path="/update/image/:link" element={<UpdateImageWrapper />} />
        <Route path="/update/video/:link" element={<UpdateVideoWrapper />} />
        
        <Route path="/" element={<ProtectedRoute><MainMenu/></ProtectedRoute>} />
        <Route path="/:specialPath*" element={<SpecialRouteHandler />} />
        <Route path="*" element={<ProtectedRoute><MainMenu/></ProtectedRoute>} />
      </Routes>
      <Analytics />
    </Router>
  );
}

export default App;
