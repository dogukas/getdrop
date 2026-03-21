-- ==========================================
-- SUPABASE PUSH BILDIRIM TETIKLEYICILERI
-- ==========================================
-- Bu SQL kodlarını Supabase projenizdeki "SQL Editor" bölümüne yapıştırıp "RUN" diyerek çalıştırın.

-- 1. Bildirim Gönderme Ana Fonksiyonu (PostgreSQL HTTP Extension gerektirir)
-- Expo Push API'sine HTTP POST isteği gönderir.
create or replace function send_expo_push_notification(push_token text, title text, body text, data jsonb default '{}'::jsonb)
returns void as $$
declare
  request_body json;
begin
  -- HTTP extension'ı yoksa ekle
  create extension if not exists http with schema extensions;

  request_body := json_build_object(
    'to', push_token,
    'title', title,
    'body', body,
    'sound', 'default',
    'data', data
  );

  perform http((
      'POST',
      'https://exp.host/--/api/v2/push/send',
      ARRAY[http_header('Content-Type', 'application/json')],
      'application/json',
      request_body::text
  )::http_request);
end;
$$ language plpgsql security definer;


-- ==========================================
-- SENARYO 1: TRANSFER DURUMU DEĞİŞTİĞİNDE BİLDİRİM GöNDER
-- ==========================================
create or replace function notify_on_transfer_status_change()
returns trigger as $$
declare
  target_user_token text;
begin
  -- Sadece durum (status) değiştiyse çalış
  if old.status is distinct from new.status then
    
    -- TRANSFER REDDEDİLİRSE: Transferi oluşturan kişiyi (created_by) bul ve bildir
    if new.status = 'rejected' and new.created_by is not null then
      select push_token into target_user_token from profiles where id = new.created_by;
      
      if target_user_token is not null then
        perform send_expo_push_notification(
          target_user_token,
          'Transfer Reddedildi ❌',
          'Transfer No: ' || new.transfer_no || ' hedef depo tarafından reddedildi.',
          jsonb_build_object('screen', 'TransferDetail', 'id', new.id)
        );
      end if;
    end if;

    -- TRANSFER ONAYLANIRSA: Transferi oluşturan kişiye (created_by) bildir
    if new.status = 'delivered' and new.created_by is not null then
      select push_token into target_user_token from profiles where id = new.created_by;
      
      if target_user_token is not null then
        perform send_expo_push_notification(
          target_user_token,
          'Transfer Teslim Edildi ✅',
          'Transfer No: ' || new.transfer_no || ' başarıyla teslim alındı.',
          jsonb_build_object('screen', 'TransferDetail', 'id', new.id)
        );
      end if;
    end if;

  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger'ı Transfers tablosuna ekle
drop trigger if exists on_transfer_status_change on transfers;
create trigger on_transfer_status_change
  after update on transfers
  for each row
  execute function notify_on_transfer_status_change();


-- ==========================================
-- SENARYO 2: KRİTİK STOK SEVİYESİ (Opsiyonel / Stok Düşüldüğünde)
-- ==========================================
create or replace function notify_on_critical_stock()
returns trigger as $$
declare
  admin_token text;
begin
  -- Stok düştüyse ve min_stock değerinin altına indiyse
  if new.stock < old.stock and new.stock <= new.min_stock then
    
    -- Depodaki veya sistemdeki bir admin/şef token'ını bul (Örnek: ilk admini alıyor)
    select push_token into admin_token from profiles where role = 'admin' limit 1;
    
    if admin_token is not null then
      perform send_expo_push_notification(
        admin_token,
        '⚠️ Kritik Stok Uyarısı',
        new.name || ' (' || new.sku || ') stok seviyesi ' || new.stock || ' ' || new.unit || ' adet/birim olarak kritik limite düştü!',
        jsonb_build_object('screen', 'Stock')
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger'ı Products tablosuna ekle
drop trigger if exists on_critical_stock_drop on products;
create trigger on_critical_stock_drop
  after update on products
  for each row
  execute function notify_on_critical_stock();
