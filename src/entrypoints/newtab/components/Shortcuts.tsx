import { Icon } from '@iconify/react';
import { Form, Input, Popconfirm, Radio, Upload } from 'antd';
import { motion } from 'framer-motion';

export const Shortcuts: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);
  const [editMode, setEditMode] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [iconType, setIconType] = useState<'url' | 'upload'>('upload');
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
      <div className="widget glass w-auto p-2" ref={containerRef}>
        <motion.div
          className="flex-center gap-3"
          key={'shortcut-bar'}
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {shortcuts.map((shortcut) => (
            <div
              className={cn(
                `group flex-center glass relative size-13 cursor-pointer rounded-xl transition-all duration-200 hover:-translate-y-3 hover:scale-120`,
                editMode && 'animate-tada'
              )}
              key={shortcut.id}
              onContextMenu={(e) => handleRightClick(e, shortcut.id)}
              // onClick={(e) => {
              //   if (editMode) e.preventDefault();
              //   else browser.tabs.create({ url: shortcut.url });
              // }}
              onClick={async (e) => {
                if (editMode) {
                  e.preventDefault();
                } else {
                  const [currentTab] = await browser.tabs.query({
                    active: true,
                    currentWindow: true,
                  });
                  if (currentTab?.id) {
                    await browser.tabs.update(currentTab.id, { url: shortcut.url });
                  }
                }
              }}
              style={{
                background: shortcut.color || 'transparent',
              }}
              title={shortcut.title}
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
                      <button className="bg-app-500 rounded-full p-1 shadow-lg transition-colors">
                        <Icon className="text-white" icon="material-symbols:delete" />
                      </button>
                    </Popconfirm>
                  </div>
                </>
              ) : shortcut.icon && shortcut.icon.includes('icon:') ? (
                <Icon
                  className={cn('text-3xl')}
                  icon={shortcut.icon.replace('icon:', '')}
                  style={{
                    ...(shortcut.textColor && { color: shortcut.textColor }),
                  }}
                />
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
          <button
            className="bg-theme flex-center size-13 cursor-pointer rounded-xl transition-all duration-200 hover:-translate-y-3 hover:scale-120"
            onClick={handleAdd}
            title={'Add New Shortcut'}
          >
            <Icon className="text-theme text-3xl" icon="material-symbols:add" />
          </button>
        </motion.div>
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
        <Form className="mt-4 space-y-2" form={form} layout="inline">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input className="min-w-87.5" placeholder="Enter shortcut title" />
          </Form.Item>
          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: 'Please enter a URL' },
              { type: 'url', message: 'Please enter a valid URL' },
            ]}
          >
            <Input className="min-w-87.5" placeholder="https://example.com" />
          </Form.Item>
          <Form.Item name="color" label="Background Color">
            <AppColorPicker
              onChange={(color) => form.setFieldValue('color', color.toHexString())}
            />
          </Form.Item>

          <Form.Item name="textColor" label="Text Color">
            <AppColorPicker
              onChange={(color) => form.setFieldValue('textColor', color.toHexString())}
            />
          </Form.Item>

          <Form.Item label="Icon Source">
            <Radio.Group value={iconType} onChange={(e) => setIconType(e.target.value)}>
              <Radio value="url">URL</Radio>
              <Radio value="upload">Upload</Radio>
            </Radio.Group>
          </Form.Item>

          {iconType === 'url' ? (
            <Form.Item name="icon" label="Icon URL">
              <Input className="min-w-87.5" placeholder="https://example.com/icon.png" />
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
