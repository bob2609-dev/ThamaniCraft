import React, { useState, useEffect } from "react";
import { 
  Row, Col, Card, Typography, Spin, Alert, 
  Button, Input, Modal, message, Badge, 
  Divider, Space, Select
} from "antd";
import { ShoppingCartOutlined, PlusOutlined, MinusOutlined, CheckCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { fetchFinishedProducts } from "../services/inventoryApi";
import { posCheckout } from "../services/salesApi";
import { listRecipes } from "../services/recipeApi";

const { Title, Text } = Typography;

export default function PointOfSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]); // Array of { product, quantity }
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetchFinishedProducts(),
      listRecipes()
    ]).then(([finishedRes, recipesRes]) => {
      if (active) {
        const fp = finishedRes.status === 'fulfilled' ? finishedRes.value : [];
        const rec = recipesRes.status === 'fulfilled' ? recipesRes.value : [];
        
        if (finishedRes.status === 'rejected') message.error("Failed to load products: " + finishedRes.reason.message);
        if (recipesRes.status === 'rejected') message.error("Failed to load recipes: " + recipesRes.reason.message);

        const formattedFp = fp.map(p => ({
          ...p,
          isRecipe: false,
          posId: `fp-${p.id}`,
          displayName: p.name,
          displayPrice: Number(p.sellingPrice || 0)
        }));

        const formattedRec = rec.map(r => ({
          ...r,
          isRecipe: true,
          posId: `rec-${r.id}`,
          displayName: `${r.name} (Made to Order)`,
          displayPrice: Number(r.suggestedPrice || r.costing?.unitCost || 0),
          recipeId: r.id
        }));

        setProducts([...formattedFp, ...formattedRec]);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.posId === product.posId);
      if (existing) {
        return prev.map(item => item.product.posId === product.posId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    message.success({ content: `Added ${product.name} to cart`, key: 'addCart', duration: 1 });
  };

  const updateQuantity = (posId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.product.posId === posId) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 0 };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      const items = cart.map(item => ({
        productId: item.product.isRecipe ? null : item.product.id,
        recipeId: item.product.isRecipe ? item.product.recipeId : null,
        productName: item.product.isRecipe ? item.product.name : item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.displayPrice || 0
      }));
      
      const payload = {
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || "N/A",
        items
      };

      await posCheckout(payload);
      
      message.success("Checkout successful!");
      clearCart();
      setCheckoutVisible(false);
      setCustomerName("");
      setCustomerPhone("");
      // optionally refresh products if stock was displayed
    } catch (e) {
      message.error("Checkout failed: " + e.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = products.filter(p => p.displayName.toLowerCase().includes(search.toLowerCase()));
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.displayPrice || 0) * item.quantity, 0);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div style={{ animation: "fadeIn 0.5s ease-out" }}>
      <Row gutter={[24, 24]}>
        {/* Product Grid */}
        <Col xs={24} lg={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Title level={2} style={{ margin: 0 }}>Point of Sale</Title>
            <Input.Search 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </div>
          
          <div style={{ height: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 12 }}>
            <Row gutter={[16, 16]}>
              {filteredProducts.map(p => (
                <Col xs={12} sm={8} md={6} key={p.posId}>
                  <Card 
                    hoverable 
                    onClick={() => addToCart(p)}
                    style={{ 
                      borderRadius: 12, 
                      textAlign: 'center',
                      border: '1px solid var(--border-subtle)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    bodyStyle={{ padding: '24px 12px' }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
                    <Text strong style={{ display: 'block', marginBottom: 4, height: 40, overflow: 'hidden' }}>{p.displayName}</Text>
                    <Text type="success" strong>TZS {(p.displayPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* Cart Pane */}
        <Col xs={24} lg={8}>
          <Card 
            className="glass-panel"
            style={{ borderRadius: 16, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}
          >
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Title level={4} style={{ margin: 0 }}>
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                Current Order
                <Badge count={cart.reduce((s, i) => s + i.quantity, 0)} style={{ marginLeft: 12, backgroundColor: '#1890ff' }} />
              </Title>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94A3B8', marginTop: 40 }}>
                  <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                  <p>Cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.posId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.product.displayName}</Text>
                      <br/>
                      <Text type="secondary">TZS {(item.product.displayPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {item.product.baseUom?.abbreviation || item.product.yieldUnit || 'unit'}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: 8, padding: '4px' }}>
                      <Button type="text" size="small" icon={<MinusOutlined />} onClick={() => updateQuantity(item.product.posId, -1)} />
                      <Text strong style={{ margin: '0 12px' }}>{item.quantity}</Text>
                      <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => updateQuantity(item.product.posId, 1)} />
                    </div>
                    <div style={{ width: 80, textAlign: 'right' }}>
                      <Text strong>TZS {((item.product.displayPrice || 0) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '0 0 16px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Total</Title>
                <Title level={4} style={{ margin: 0, color: '#10B981' }}>TZS {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Title>
              </div>
              
              <Row gutter={12}>
                <Col span={8}>
                  <Button danger block size="large" onClick={clearCart} disabled={cart.length === 0} icon={<DeleteOutlined />}>Clear</Button>
                </Col>
                <Col span={16}>
                  <Button 
                    type="primary" 
                    block 
                    size="large" 
                    disabled={cart.length === 0} 
                    onClick={() => setCheckoutVisible(true)}
                    icon={<CheckCircleOutlined />}
                    style={{ background: '#10B981', borderColor: '#10B981' }}
                  >
                    Checkout
                  </Button>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Checkout Modal */}
      <Modal
        title="Complete Checkout"
        open={checkoutVisible}
        onCancel={() => setCheckoutVisible(false)}
        onOk={handleCheckout}
        confirmLoading={checkoutLoading}
        okText="Confirm & Pay"
        okButtonProps={{ style: { background: '#10B981', borderColor: '#10B981' } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Customer Name (Optional)</Text>
          <Input 
            value={customerName} 
            onChange={e => setCustomerName(e.target.value)} 
            placeholder="Walk-in Customer" 
            size="large"
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">Customer Phone (Optional)</Text>
          <Input 
            value={customerPhone} 
            onChange={e => setCustomerPhone(e.target.value)} 
            placeholder="+255..." 
            size="large"
          />
        </div>
        
        <Divider />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 18 }}>Amount to Pay</Text>
          <Text strong style={{ fontSize: 24, color: '#10B981' }}>TZS {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </div>
      </Modal>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
