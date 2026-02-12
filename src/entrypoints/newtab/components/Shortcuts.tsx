import { Icon } from '@iconify/react';
import { Form, Input, Modal, Popconfirm, Radio, Upload } from 'antd';

export const defaultShortcuts: Shortcut[] = [
  {
    id: 'google',
    title: 'Google',
    url: 'https://www.google.com',
    icon: 'icon:logos:google-icon',
  },
  {
    id: 'youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    icon: 'icon:logos:youtube-icon',
  },
  {
    id: 'gmail',
    title: 'Gmail',
    url: 'https://mail.google.com',
    icon: 'icon:logos:google-gmail',
  },
  {
    id: 'facebook',
    title: 'Facebook',
    url: 'https://www.facebook.com',
    icon: 'icon:logos:facebook',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    url: 'https://www.instagram.com',
    icon: 'icon:skill-icons:instagram',
  },
  {
    id: 'twitter',
    title: 'X (Twitter)',
    url: 'https://twitter.com',
    icon: 'icon:logos:twitter',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn',
    url: 'https://www.linkedin.com',
    icon: 'icon:logos:linkedin-icon',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    url: 'https://web.whatsapp.com',
    icon: 'icon:logos:whatsapp-icon',
  },
  {
    id: 'github',
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'icon:logos:github-icon',
  },
  {
    id: 'chatgpt',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'icon:simple-icons:openai',
  },
  {
    id: 'netflix',
    title: 'Netflix',
    url: 'https://www.netflix.com',
    icon: 'icon:logos:netflix-icon',
  },
  {
    id: 'amazon',
    title: 'Amazon',
    url: 'https://www.amazon.com',
    icon: 'icon:logos:amazon',
  },
];

export const Shortcuts: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [editMode, setEditMode] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [iconType, setIconType] = useState<'url' | 'upload'>('url');
  const [iconFile, setIconFile] = useState<string | null>(null);
  const [form] = Form.useForm();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadShortcuts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setEditMode(false);
        setSelectedShortcut(null);
      }
    };

    if (editMode) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editMode]);

  const loadShortcuts = async () => {
    const data = await getShortcuts();
    setShortcuts((prev) => [...prev, ...data]);
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setEditMode(true);
    setSelectedShortcut(id);
  };

  const handleEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setIconFile(shortcut.iconFile || null);
    setIconType(shortcut.iconFile ? 'upload' : 'url');
    form.setFieldsValue(shortcut);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteShortcut(id);
    await loadShortcuts();
    setEditMode(false);
    setSelectedShortcut(null);
  };

  const handleAdd = () => {
    setEditingShortcut(null);
    setIconFile(null);
    setIconType('url');
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleIconUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setIconFile(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const shortcutData = {
        ...values,
        iconFile: iconType === 'upload' ? iconFile : null,
        icon: iconType === 'url' ? values.icon : null,
      };

      if (editingShortcut) {
        await updateShortcut(editingShortcut.id, shortcutData);
      } else {
        await addShortcut(shortcutData);
      }
      await loadShortcuts();
      setIsModalOpen(false);
      setEditMode(false);
      setSelectedShortcut(null);
      setIconFile(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getFavicon = (url: string): string => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  };

  const getIconSrc = (shortcut: Shortcut): string => {
    if (shortcut.iconFile) return shortcut.iconFile;
    if (shortcut.icon) return shortcut.icon;
    return getFavicon(shortcut.url);
  };

  return (
    <>
      <div
        className="widget glass flex-center w-auto gap-4 p-2"
        ref={containerRef}
        style={{
          animationName: 'slide-up',
        }}
      >
        {shortcuts.map((shortcut) => (
          <div
            className={cn(
              'group flex-center glass relative size-16.5 rounded-xl',
              editMode && 'animate-tada'
            )}
            key={shortcut.id}
            onContextMenu={(e) => handleRightClick(e, shortcut.id)}
            // href={shortcut.url}
            //   onClick={(e) => {
            //     if (editMode) e.preventDefault();
            //   }}
          >
            {editMode && selectedShortcut === shortcut.id ? (
              <>
                <button
                  className="flex-center bg-theme text-theme h-full w-full cursor-pointer overflow-hidden rounded-xl"
                  onClick={() => handleEdit(shortcut)}
                >
                  <Icon className="text-2xl" icon="material-symbols:edit" />
                </button>
                <div className="animate-scale-in absolute -top-2 -right-2 z-10 flex cursor-pointer gap-1">
                  <Popconfirm
                    title="Delete shortcut"
                    description="Are you sure you want to delete this shortcut?"
                    onConfirm={() => handleDelete(shortcut.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <button className="bg-app-500 rounded-full p-2 shadow-lg transition-colors">
                      <Icon className="text-white" icon="material-symbols:delete" />
                    </button>
                  </Popconfirm>
                </div>
              </>
            ) : shortcut.icon && shortcut.icon.includes('icon:') ? (
              <Icon className="text-3xl" icon={shortcut.icon.replace('icon:', '')} />
            ) : (
              <img
                className="overflow-hidden rounded-xl object-cover"
                src={getIconSrc(shortcut)}
                alt={shortcut.title}
                onError={(e) => {
                  if (!shortcut.iconFile && !shortcut.icon) {
                    (e.target as HTMLImageElement).src = getFavicon(shortcut.url);
                  }
                }}
              />
            )}
          </div>
        ))}
        <div className="bg-theme block h-6 w-px" />
        <button className="bg-theme flex-center size-16.5 rounded-xl" onClick={handleAdd}>
          <Icon className="text-3xl" icon="material-symbols:add" />
        </button>
      </div>

      <Modal
        title={editingShortcut ? 'Edit Shortcut' : 'Add Shortcut'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalOpen(false);
          setIconFile(null);
        }}
        okText={editingShortcut ? 'Update' : 'Add'}
      >
        <Form className="mt-4" form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter shortcut title" />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: 'Please enter a URL' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item label="Icon Source">
            <Radio.Group value={iconType} onChange={(e) => setIconType(e.target.value)}>
              <Radio value="url">URL</Radio>
              <Radio value="upload">Upload</Radio>
            </Radio.Group>
          </Form.Item>

          {iconType === 'url' ? (
            <Form.Item name="icon" label="Icon URL">
              <Input placeholder="https://example.com/icon.png" />
            </Form.Item>
          ) : (
            <Form.Item label="Upload Icon">
              <Upload beforeUpload={handleIconUpload} showUploadList={false} accept="image/*">
                <Button icon={<Icon icon="material-symbols:upload" />}>Choose Image</Button>
              </Upload>
              {iconFile && (
                <div className="mt-2">
                  <img className="h-16 w-16 rounded object-cover" src={iconFile} alt="Preview" />
                </div>
              )}
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};
