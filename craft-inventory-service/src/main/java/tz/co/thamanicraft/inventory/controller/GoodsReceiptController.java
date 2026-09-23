package tz.co.thamanicraft.inventory.controller;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.http.*; import org.springframework.security.access.prepost.PreAuthorize; import org.springframework.web.bind.annotation.*; import tz.co.thamanicraft.inventory.dto.GoodsReceiptRequest; import tz.co.thamanicraft.inventory.service.GoodsReceiptService; import java.util.*;
@RestController @RequestMapping("/goods-receipts") @RequiredArgsConstructor
public class GoodsReceiptController { private final GoodsReceiptService service;
 @PostMapping @PreAuthorize("hasAuthority('ADJUST_INVENTORY') or hasRole('OWNER')") public ResponseEntity<Map<String,UUID>> receive(@Valid @RequestBody GoodsReceiptRequest request) { UUID id=service.receive(request); return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id",id)); }
 @GetMapping @PreAuthorize("hasAuthority('VIEW_INVENTORY') or hasRole('OWNER')") public List<Map<String,Object>> list() { return service.list(); }
}
